import Logger from 'bunyan';

import { PostgreService } from '../../../../services/postgre';
import { TezosService } from '../../../../services/tezos';
import {
  selectPublishedJobsWithOperationHash,
  updateJobStatus,
} from '../../../../models/jobs';
import { IndexerPool } from '../../../../services/indexer-pool';
import { nbOfConfirmation, nbOfRetry } from '../../../../config';
import { JobStatus } from '../../../../const/job-status';
import { OperationNotFoundError } from '../../../../const/errors/indexer-error';
import { AmqpService } from '../../../../services/amqp';
import { selectTransaction } from '../../../../models/transactions';
import { TransactionParametersJson } from '../../../../const/interfaces/transaction-parameters-json';
import { publishEventWhenTransactionsConfirmed } from './publish-confirmed-transaction-event';

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
            { operationHash: job.operation_hash as string, nbOfConfirmation },
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

          const transactions = await selectTransaction(
            postgreService.pool,
            'destination,parameters_json',
            `job_id=${job.id}`,
          );

          logger.info(
            { jobId: job.id, transactionsParameters: transactions },
            '[lib/checkOperationStatus] Get all the transactions parameters related to this job id',
          );

          await Promise.all(
            transactions.map(async (transaction) => {
              const parameters = JSON.parse(
                transaction.parameters_json,
              ) as TransactionParametersJson;

              await publishEventWhenTransactionsConfirmed(
                amqpService,
                {
                  contractAddress: transaction.destination,
                  entrypoint: parameters.entrypoint,
                  parameters,
                  jobId: job.id,
                },
                {
                  entrypoint: parameters.entrypoint,
                  contractAddress: transaction.destination,
                  callerId: transaction.caller_id,
                },
              );
              logger.info(
                { transaction },
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
}
