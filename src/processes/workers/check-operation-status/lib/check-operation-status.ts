import Logger from 'bunyan';

import { PostgreService } from '../../../../services/postgre';
import { TezosService } from '../../../../services/tezos';
import {
  selectPublishedJobsWithOperationHash,
  updateJobStatus,
} from '../../../../models/jobs';
import { IndexerPool } from '../../../../services/indexer-pool';
import {
  nbOfConfirmation,
  nbOfRetry,
  operationExpirationTimeoutInMinutes,
} from '../../../../config';
import { JobStatus } from '../../../../const/job-status';
import { OperationNotFoundError } from '../../../../const/errors/indexer-error';
import { AmqpService } from '../../../../services/amqp';
import {
  isOperationAReveal,
  selectOperation,
} from '../../../../models/operations';
import { TransactionParametersJson } from '../../../../const/interfaces/transaction-parameters-json';
import {
  publishEventWhenRevealConfirmed,
  publishEventWhenTransactionsConfirmed,
} from './publish-confirmed-transaction-event';

/**
 * Check the operations (of all the jobs that has status "submitted" and operation hash) has been confirmed
 * If yes, update the jobs statuses to "confirmed"
 *
 * @param {object} postgreService   - the postgre service
 * @param {object} tezosService     - the tezos service
 * @param {object} indexerPool      - the indexer pool
 * @param {object} logger           - the logger
 */
export async function checkOperationStatus(
  {
    postgreService,
    tezosService,
    amqpService,
    indexerPool,
  }: {
    postgreService: PostgreService;
    tezosService: TezosService;
    amqpService: AmqpService;
    indexerPool: IndexerPool;
  },
  logger: Logger,
) {
  const jobs = await selectPublishedJobsWithOperationHash(postgreService.pool);

  await Promise.all(
    jobs.map(async (job) => {
      try {
        if (
          await indexerPool.checkIfOperationIsConfirmedByRandomIndexer(
            tezosService,
            {
              operationHash: job.operation_hash as string,
              nbOfConfirmation,
              opExpirationInMinutes: operationExpirationTimeoutInMinutes,
            },
            nbOfRetry,
          )
        ) {
          const updatedJob = await updateJobStatus(
            postgreService.pool,
            JobStatus.DONE,
            job.id,
          );
          logger.info(
            { updatedJob },
            '[lib/checkOperationStatus] Successfully update the job',
          );

          const operations = await selectOperation(
            postgreService.pool,
            'destination,parameters_json,caller_id,kind,source,public_key',
            `job_id=${job.id}`,
          );

          logger.info(
            { jobId: job.id, transactionsParameters: operations },
            '[lib/checkOperationStatus] Get all the transactions parameters related to this job id',
          );

          await Promise.all(
            operations.map(async (operation) => {
              if (isOperationAReveal(operation)) {
                await publishEventWhenRevealConfirmed(
                  amqpService,
                  {
                    address: operation.source,
                    public_key: operation.public_key,
                  },
                  {
                    callerId: operation.caller_id,
                  },
                );
              } else {
                const parameters = JSON.parse(
                  operation.parameters_json as string,
                ) as TransactionParametersJson;

                await publishEventWhenTransactionsConfirmed(
                  amqpService,
                  {
                    contractAddress: operation.destination,
                    entrypoint: parameters.entrypoint,
                    jobId: job.id,
                    parameters,
                  },
                  {
                    entrypoint: parameters.entrypoint,
                    contractAddress: operation.destination,
                    callerId: operation.caller_id,
                  },
                );
              }

              logger.info(
                { operation },
                '[lib/checkOperationStatus] Successfully publish the message to RabbitMq',
              );
            }),
          );
        }
      } catch (err) {
        if (!(err instanceof OperationNotFoundError)) {
          logger.error(
            { err },
            '[lib/checkOperationStatus] Unexpected error happen',
          );
        }
      }
    }),
  );
  logger.info('✔ Check operation status is done successfully');
}
