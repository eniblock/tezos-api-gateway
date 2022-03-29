import Logger from 'bunyan';

import { PostgreService } from '../../services/postgre';
import { Jobs } from '../../const/interfaces/jobs';
import { TezosService } from '../../services/tezos';
import {
  selectJobs,
  updateJobStatusAndErrorMessage,
  updateJobStatusAndOperationHash,
} from '../../models/jobs';
import { JobStatus } from '../../const/job-status';
import { insertTransaction } from '../../models/operations';
import { JobIdNotFoundError } from '../../const/errors/job-id-not-found-error';
import { GatewayPool } from '../../services/gateway-pool';
import { SendTransferTransactionsToQueueParams } from '../../const/interfaces/send-transfer-transactions-params';
import { TransferTransactions } from '../../const/interfaces/user/transfer/transfer-tokens';
import { BatchOperation } from '@taquito/taquito/dist/types/operations/batch-operation';
import { TransactionOperation } from '@taquito/taquito/dist/types/operations/transaction-operation';

/**
 * Send the list of transactions to the tezos service
 * Use the vault signer to sign
 *
 * @param {object[]} transactions   - the list of transactions with transaction details
 * @param {object} vaultSigner      - the vault signer which is used to sign transaction
 * @param {number} jobId            - the id of the job that dedicated to this request
 * @param {string} callerId         - the name/id of the application that sent the tx request
 * @param {object} gatewayPool      - the gateway pool to get a tezos service
 * @param {object} postgreService   - the postgre service
 * @param logger
 *
 * @return {object} the job corresponding the action
 */
export async function sendTransferTransactions(
  {
    transactions,
    vaultSigner,
    jobId,
    callerId,
  }: SendTransferTransactionsToQueueParams,
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  logger: Logger,
) {
  try {
    const tezosService = await gatewayPool.getTezosService();

    logger.info(
      {
        tezosNode: tezosService.tezos.rpc.getRpcUrl(),
      },
      '[lib/jobs/send-transfer-transactions/#sendTransactions] Using this tezos node',
    );

    const [job] = await selectJobs(postgreService.pool, 'id', `id=${jobId}`);

    if (!job) {
      throw new JobIdNotFoundError(`Could not find job with this id: ${jobId}`);
    }

    tezosService.setSigner(vaultSigner);

    const { hash: operationHash } = await getTransferOperationHashFromTezos(
      transactions,
      tezosService,
    );

    logger.info(
      { operationHash },
      '[lib/jobs/send-transfer-transactions/#sendTransactions] Successfully send the transactions to Tezos',
    );

    const pkh = await vaultSigner.publicKeyHash();

    if (!pkh || !operationHash) {
      throw new Error('Public key hash or operation hash is undefined');
    }

    await insertTransferTransactions(
      postgreService,
      transactions,
      jobId,
      pkh,
      callerId ? callerId : '',
    );

    logger.info(
      { transactions, jobId, accountAddress: pkh },
      '[lib/jobs/send-transfer-transactions/#sendTransactions] Successfully insert the transactions with this job id for this account',
    );

    const result = await updateJobStatusAndOperationHash(
      postgreService.pool,
      JobStatus.PUBLISHED,
      operationHash,
      jobId,
    );

    logger.info(
      { result },
      '[lib/jobs/send-transfer-transactions/#sendTransactions] Successfully update job status and operation hash',
    );

    return result[0] as Jobs;
  } catch (err) {
    if (!(err instanceof JobIdNotFoundError)) {
      await updateJobStatusAndErrorMessage(
        postgreService.pool,
        JobStatus.ERROR,
        err.message,
        jobId,
      );
    }

    logger.error(
      { error: err.message },
      '[lib/jobs/send-transfer-transactions/#sendTransferTransactions] Unexpected error happened',
    );

    throw err;
  }
}

/**
 * Retrieve the operation hash from the tezos by:
 * - sending batch (if there is a list of transactions)
 * - transfer tokens directly (if there is only 1 transaction in the list)
 *
 * @param {object[]} transactions  - the list of transactions
 * @param {object} tezosService    - the tezos service
 *
 * @return {string} the operation hash related to the transactions send
 */
async function getTransferOperationHashFromTezos(
  transactions: TransferTransactions[],
  tezosService: TezosService,
): Promise<BatchOperation | TransactionOperation> {
  if (transactions.length === 1) {
    return tezosService.transfer({
      to: transactions[0].to,
      amount: transactions[0].amount,
      mutez: true,
    });
  }

  const batch = await tezosService.createBatch();

  for (const transaction of transactions) {
    batch.withTransfer({
      to: transaction.to,
      amount: transaction.amount,
      mutez: true,
    });
  }

  return batch.send();
}

/**
 * Insert the transactions after successfully publish the transactions to the queue
 *
 * @param {object} postgreService   - the postgre service
 * @param {object[]} transactions   - the list of transactions with transaction details
 * @param {number} jobId            - the id of the job that dedicated to this request
 * @param {string} pkh              - the tezos address of the account that made the request
 * @param {string} callerId         - the name/id of the application that sent the tx request
 */
async function insertTransferTransactions(
  postgreService: PostgreService,
  transactions: TransferTransactions[],
  jobId: number,
  pkh: string,
  callerId: string,
) {
  await Promise.all(
    transactions.map(async ({ to, amount }) => {
      await insertTransaction(postgreService.pool, {
        destination: to,
        source: pkh,
        amount,
        jobId,
        callerId,
      });
    }),
  );
}
