import Logger from 'bunyan';

import { PostgreService } from '../../../../services/postgre';
import { TezosService } from '../../../../services/tezos';
import {
  selectPublishedJobsWithOperationHash,
  updateJobStatus,
  updateJobStatusAndErrorMessage,
} from '../../../../models/jobs';
import { IndexerPool } from '../../../../services/indexer-pool';
import {
  nbOfConfirmation,
  nbOfRetry,
  operationExpirationTimeoutInMinutes,
} from '../../../../config';
import { JobStatus } from '../../../../const/job-status';
import {
  OperationFailedError,
  OperationNotFoundError,
} from '../../../../const/errors/indexer-error';
import { AmqpService } from '../../../../services/amqp';
import {
  isOperationAReveal,
  selectOperation,
  updateOperationUpdateDate,
} from '../../../../models/operations';
import { TransactionParametersJson } from '../../../../const/interfaces/transaction-parameters-json';
import {
  publishEventWhenRevealConfirmed,
  publishEventWhenTransactionsConfirmed,
} from './publish-confirmed-transaction-event';
import { GatewayPool } from '../../../../services/gateway-pool';
import { DateTime } from 'luxon';
// import { IndexerEnum } from '../../../../const/interfaces/indexer';

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
    gatewayPool,
  }: {
    postgreService: PostgreService;
    tezosService: TezosService;
    amqpService: AmqpService;
    indexerPool: IndexerPool;
    gatewayPool: GatewayPool;
  },
  logger: Logger,
) {
  const jobs = await selectPublishedJobsWithOperationHash(postgreService.pool);

  await Promise.all(
    jobs.map(async (job) => {
      try {
        // quick fix not used gatewayPool
        if (!gatewayPool) logger.info('gatewayPool is not used');

        if (
          await indexerPool.checkIfOperationIsConfirmedByRandomIndexer(
            tezosService,
            {
              operationHash: job.operation_hash as string,
              nbOfConfirmation,
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
            '[lib/checkOperationStatus] Successfully update the job with SUCCESS status',
          );

          const updatedOperations = await updateOperationUpdateDate(
            postgreService.pool,
            job.id,
          );
          logger.info(
            { update_time: updatedOperations[0]?.update_time, jobId: job.id },
            '[lib/checkOperationStatus] Successfully updated update_date of operations with jobId',
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
        if (err instanceof OperationNotFoundError) {
          const operations = await selectOperation(
            postgreService.pool,
            '*',
            `job_id=${job.id}`,
          );

          const opCreationDate = operations[0].creation_date;

          if (!opCreationDate) return;

          const opExpiredDate = DateTime.fromISO(opCreationDate)
            .plus({ minutes: operationExpirationTimeoutInMinutes })
            .toString();

          const currentDate = DateTime.now().toString();

          if (currentDate > opExpiredDate) {
            // removeOperationFromMempool forbidden now TODO: inspect
            // try {
            //   await gatewayPool.removeOperationFromMempool(
            //     job.operation_hash as string,
            //   );
            //   logger.info(
            //     { operation_hash: job.operation_hash },
            //     '[lib/checkOperationStatus] Successfully removed the operation from the mempool with operation hash',
            //   );
            // } catch (e) {
            //   logger.info(
            //     { operation_hash: job.operation_hash },
            //     "[lib/checkOperationStatus] Couldn't removed the operation from the mempool with operation hash",
            //   );
            // }

            const updatedJob = await updateJobStatus(
              postgreService.pool,
              JobStatus.ERROR,
              job.id,
            );
            logger.info(
              { updatedJob },
              '[lib/checkOperationStatus] Successfully updated the job to ERROR status',
            );

            const updatedOperations = await updateOperationUpdateDate(
              postgreService.pool,
              job.id,
            );
            logger.info(
              { update_time: updatedOperations[0].update_time, jobId: job.id },
              '[lib/checkOperationStatus] Successfully updated update_date of operations with jobId',
            );
          }
        }

        if (err instanceof OperationFailedError) {
          const errorMsg = 'runtime_error';
          // try {
          //   const indexer = indexerPool.getSpecificIndexer(IndexerEnum.TZSTATS);
          //   const operation = await indexer.getOperationByHash(
          //     job.operation_hash!,
          //   );
          //   errorMsg = operation.errors[1].with.string;
          // } catch (e) {
          //   logger.info(
          //     '[lib/checkOperationStatus] Cannot find error msg for failed operation',
          //   );
          // }
          const updatedJob = await updateJobStatusAndErrorMessage(
            postgreService.pool,
            JobStatus.ERROR,
            errorMsg,
            job.id,
          );
          logger.info(
            { updatedJob },
            '[lib/checkOperationStatus] Successfully updated the job to ERROR status',
          );

          const updatedOperations = await updateOperationUpdateDate(
            postgreService.pool,
            job.id,
          );
          logger.info(
            { update_time: updatedOperations[0].update_time, jobId: job.id },
            '[lib/checkOperationStatus] Successfully updated update_date of operations with jobId',
          );
        }

        if (
          !(
            err instanceof OperationNotFoundError ||
            err instanceof OperationFailedError
          )
        ) {
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
