import { OperationContentsTransaction, OpKind } from '@taquito/rpc';
import _ from 'lodash';
import { JobIdNotFoundError } from '../../const/errors/job-id-not-found-error';
import { Jobs } from '../../const/interfaces/jobs';
import { PatchJobParams } from '../../const/interfaces/patch-job-params';
import { Transaction } from '../../const/interfaces/transaction';
import { JobStatus } from '../../const/job-status';
import {
  updateJobStatusAndErrorMessage,
  updateOperationHash
} from '../../models/jobs';
import { selectTransaction } from '../../models/transactions';
import { AmqpService } from '../../services/amqp';
import { GatewayPool } from '../../services/gateway-pool';
import { logger } from '../../services/logger';
import { PostgreService } from '../../services/postgre';
import { publishErrorToInjectionQueue } from '../amqp/publish-error-to-injection-queue';

const INJECT_OPERATION_KNOWN_ERRORS = ['JobIdNotFoundError'];

/**
 * This function will store the signed transaction in the database,
 * then preapply the operation for the tezos
 * then inject the operation to the Tezos blockchain
 *
 * @param {object} gatewayPool       - the gateway pool to get a tezos service
 * @param {object} postgreService    - the postgre service
 * @param {number} jobId             - the id of job that holds the corresponding raw transaction
 * @param {string} signature         - the signature that used to sign the raw transaction
 * @param {string} signedTransaction - the signed transaction
 *
 * @return Promise<string> the operation hash after injection
 */
export async function injectOperation(
  {
    gatewayPool,
    postgreService,
    amqpService,
  }: {
    gatewayPool: GatewayPool;
    postgreService: PostgreService;
    amqpService: AmqpService;
  },
  { jobId, signature, signedTransaction }: PatchJobParams,
): Promise<void> {
  try {
    const tezosService = await gatewayPool.getTezosService();

    logger.info(
      {
        tezosNode: tezosService.tezos.rpc.getRpcUrl(),
      },
      '[lib/jobs/inject-operation/#injectOperation] Using this tezos node',
    );

    const transactionsList: Transaction[] = await selectTransaction(
      postgreService.pool,
      '*',
      `job_id = ${jobId}`,
    );

    if (_.isEmpty(transactionsList)) {
      throw new JobIdNotFoundError(
        `Could not find the forge parameter with this job id: ${jobId}`,
      );
    }

    const params: OperationContentsTransaction[] = transactionsList.map(
      (transaction) => {
        return {
          kind: OpKind.TRANSACTION,
          destination: transaction.destination,
          parameters: JSON.parse(transaction.parameters!),
          amount: transaction.amount!.toString(),
          fee: transaction.fee!.toString(),
          source: transaction.source,
          storage_limit: transaction.storage_limit!.toString(),
          gas_limit: transaction.gas_limit!.toString(),
          counter: transaction.counter!.toString(),
        };
      },
    );

    logger.info(
      { params, branch: transactionsList[0].branch },
      '[lib/jobs/inject-operation/#injectOperation] Form the parameters to preapply operation',
    );

    await tezosService.preapplyOperations(
      transactionsList[0].branch!,
      params,
      signature,
    );

    logger.info(
      '[lib/jobs/inject-operation/#injectOperation] Successfully preapplied operation',
    );

    const operationHash = await tezosService.injectedOperations(
      signedTransaction,
    );

    logger.info(
      { operationHash },
      '[lib/jobs/inject-operation/#injectOperation] Successfully injected operation',
    );

    const [updatedJob]: Jobs[] = await updateOperationHash(
      postgreService.pool,
      operationHash,
      jobId,
    );

    if (!updatedJob) {
      throw new JobIdNotFoundError(`Could not find job with this id: ${jobId}`);
    }
  } catch (err) {
    
    const errorMessage = err.message;

    if (!(err instanceof JobIdNotFoundError)) {
      await updateJobStatusAndErrorMessage(
        postgreService.pool,
        JobStatus.ERROR,
        errorMessage,
        jobId,
      );
    }

    if (INJECT_OPERATION_KNOWN_ERRORS.includes(err.constructor.name)) {
      logger.info(
        { err },
        `[lib/jobs/inject-operation/#injectOperation] ${err.constructor.name} error happened`,
      );
      throw err;
    }

    logger.error(
      { error: err },
      '[lib/jobs/inject-operation/#injectOperation] Unexpected error happened',
    );

    // Publishing error on Injection Queue
    publishErrorToInjectionQueue(amqpService, {
      jobId,
      errorMessage,
    });

    throw err;
  }
}
