import _ from 'lodash';
import { OperationContentsTransaction, OpKind } from '@taquito/rpc';

import { PostgreService } from '../../services/postgre';
import { PatchJobParams } from '../../const/interfaces/patch-job-params';
import { logger } from '../../services/logger';
import { JobIdNotFoundError } from '../../const/errors/job-id-not-found-error';
import { Jobs } from '../../const/interfaces/jobs';
import {
  updateJobStatusAndErrorMessage,
  updateOperationHash,
} from '../../models/jobs';
import { selectOperation } from '../../models/operations';
import { Operation } from '../../const/interfaces/transaction';
import { JobStatus } from '../../const/job-status';
import { GatewayPool } from '../../services/gateway-pool';
import { OperationContentsReveal } from '@taquito/rpc/dist/types/types';

const INJECT_OPERATION_KNOWN_ERRORS = [
  'JobIdNotFoundError',
  'TezosPreapplyFailureError',
];

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
  }: {
    gatewayPool: GatewayPool;
    postgreService: PostgreService;
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

    const operationsList: Operation[] = await selectOperation(
      postgreService.pool,
      '*',
      `job_id = ${jobId}`,
    );

    if (_.isEmpty(operationsList)) {
      throw new JobIdNotFoundError(
        `Could not find the forge parameter with this job id: ${jobId}`,
      );
    }

    const params: (OperationContentsTransaction | OperationContentsReveal)[] =
      mapOperations(operationsList);

    logger.info(
      { params, branch: operationsList[0].branch },
      '[lib/jobs/inject-operation/#injectOperation] Form the parameters to preapply operation',
    );

    await tezosService.preapplyOperations(
      operationsList[0].branch!,
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
    if (!(err instanceof JobIdNotFoundError)) {
      await updateJobStatusAndErrorMessage(
        postgreService.pool,
        JobStatus.ERROR,
        err.message,
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

    throw err;
  }
}

function mapOperations(
  transactionsList: Operation[],
): (OperationContentsTransaction | OperationContentsReveal)[] {
  return transactionsList.map((transaction) => {
    if (transaction.kind === OpKind.REVEAL)
      return {
        kind: transaction.kind,
        source: transaction.source,
        fee: transaction.fee!.toString(),
        counter: transaction.counter!.toString(),
        gas_limit: transaction.gas_limit!.toString(),
        storage_limit: transaction.storage_limit!.toString(),
        public_key: transaction.public_key!,
      };

    return {
      kind: transaction.kind,
      destination: transaction.destination,
      parameters: JSON.parse(transaction.parameters!),
      amount: transaction.amount!.toString(),
      fee: transaction.fee!.toString(),
      source: transaction.source,
      storage_limit: transaction.storage_limit!.toString(),
      gas_limit: transaction.gas_limit!.toString(),
      counter: transaction.counter!.toString(),
    };
  });
}
