import Logger from 'bunyan';

import { getContractMethod } from '../smart-contracts';
import { PostgreService } from '../../services/postgre';
import { Jobs } from '../../const/interfaces/jobs';
import { TezosService } from '../../services/tezos';
import {
  insertJob,
  selectJobs,
  updateJobStatusAndErrorMessage,
  updateJobStatusAndOperationHash,
} from '../../models/jobs';
import {
  SendTransactionsParams,
  SendTransactionsToQueueParams,
  TransactionDetails,
} from '../../const/interfaces/send-transactions-params';
import { VaultSigner } from '../../services/signers/vault';
import { JobStatus } from '../../const/job-status';
import { AmqpService } from '../../services/amqp';
import { sendToSendTransactionQueue } from '../amqp/send-to-send-transaction-queue';
import { vaultClientConfig } from '../../config';
import { insertTransactionWithParametersJson } from '../../models/operations';
import { JobIdNotFoundError } from '../../const/errors/job-id-not-found-error';
import { GatewayPool } from '../../services/gateway-pool';

const SEND_TRANSACTIONS_KNOWN_ERRORS = [
  'InvalidEntryPointParams',
  'InvalidMapStructureParams',
];

/**
 * Create a job, publish the send transactions request to the queue
 * then update the job status
 *
 * @param {object} sendTransactionsParams  - contains a list of transactions which should be sent to Tezos
 * and the secure key name which is used to sign and get public key
 * @param {object} postgreService          - postgre service
 * @param {object} amqpService             - amqp service
 * @param {object} logger                  - the logger
 *
 * @return {Promise<object>} the job object
 */
export async function sendTransactionsAsync(
  sendTransactionsParams: SendTransactionsParams,
  postgreService: PostgreService,
  amqpService: AmqpService,
  logger: Logger,
) {
  try {
    const {
      rows: [insertedJob],
    } = await insertJob(postgreService.pool, {
      status: JobStatus.CREATED,
    });

    const jobId = insertedJob.id;
    const callerId = sendTransactionsParams.callerId;

    logger.info(
      { insertedJob },
      '[lib/jobs/sendTransactionsAsync] Successfully create a job',
    );

    await sendToSendTransactionQueue(amqpService, {
      ...sendTransactionsParams,
      jobId,
      callerId,
    });

    logger.info(
      { insertedJob },
      '[lib/jobs/sendTransactionsAsync] Successfully publish send transactions request to the queue',
    );

    return insertedJob as Jobs;
  } catch (err) {
    logger.error(
      { error: err.message },
      '[lib/jobs/sendTransactionsAsync] Unexpected error happened',
    );

    throw err;
  }
}

/**
 * Send the list of transactions to the tezos service
 * Use the vault signer to sign
 *
 * @param {object[]} transactions   - the list of transactions with transaction details
 * @param {string} secureKeyName    - the secure key name
 * @param {number} jobId            - the id of the job that dedicated to this request
 * @param {object} gatewayPool      - the gateway pool to get a tezos service
 * @param {object} postgreService   - the postgre service
 * @param {object} vaultSigner      - the vault signer which is used to sign transaction
 *
 * @return {object} the job corresponding the action
 */
export async function sendTransactions(
  {
    transactions,
    secureKeyName,
    jobId,
    callerId,
    useCache,
  }: SendTransactionsToQueueParams,
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
      '[lib/jobs/send-transactions/#sendTransactions] Using this tezos node',
    );

    const [job] = await selectJobs(postgreService.pool, 'id', `id=${jobId}`);

    if (!job) {
      throw new JobIdNotFoundError(`Could not find job with this id: ${jobId}`);
    }
    const vaultSigner = new VaultSigner(
      vaultClientConfig,
      secureKeyName,
      logger,
    );

    tezosService.setSigner(vaultSigner);

    const { hash: operationHash } = await getOperationHashFromTezos(
      transactions,
      useCache,
      tezosService,
      logger,
    );

    logger.info(
      { operationHash },
      '[lib/jobs/send-transactions/#sendTransactions] Successfully send the transactions to Tezos',
    );

    const pkh = await vaultSigner.publicKeyHash();

    if (!pkh || !operationHash) {
      throw new Error('Public key hash or operation hash is undefined');
    }

    await insertTransactions(
      postgreService,
      transactions,
      jobId,
      pkh,
      callerId ? callerId : '',
    );

    logger.info(
      { transactions, jobId, accountAddress: pkh },
      '[lib/jobs/send-transactions/#sendTransactions] Successfully insert the transactions with this job id for this account',
    );

    const result = await updateJobStatusAndOperationHash(
      postgreService.pool,
      JobStatus.PUBLISHED,
      operationHash,
      jobId,
    );

    logger.info(
      { result },
      '[lib/jobs/send-transactions/#sendTransactions] Successfully update job status and operation hash',
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

    if (SEND_TRANSACTIONS_KNOWN_ERRORS.includes(err.constructor.name)) {
      throw err;
    }

    logger.error(
      { error: err.message },
      '[lib/jobs/send-transactions/#sendTransactions] Unexpected error happened',
    );

    throw err;
  }
}

/**
 * Retrieve the operation hash from the tezos by:
 * - sending batch (if there is a list of transactions)
 * - calling contract method directly (if there is only 1 transaction in the list)
 *
 * @param {object[]} transactions  - the list of transactions
 * @param {object} tezosService    - the tezos service
 *
 * @return {string} the operation hash related to the transactions send
 */
async function getOperationHashFromTezos(
  transactions: TransactionDetails[],
  useCache: boolean,
  tezosService: TezosService,
  logger: Logger,
) {
  if (transactions.length === 1) {
    return (
      await getContractMethodByTransactionDetails(
        transactions[0],
        useCache,
        tezosService,
        logger,
      )
    ).send();
  }

  const batch = await tezosService.createBatch();

  for (const transaction of transactions) {
    batch.withContractCall(
      await getContractMethodByTransactionDetails(
        transaction,
        useCache,
        tezosService,
        logger,
      ),
    );
  }

  return batch.send();
}

/**
 * Get the contract method by given contract address,
 * entry point name and entry point parameters
 *
 * @param {string} contractAddress                     - the smart contract address on Tezos
 * @param {object | string | number} entryPointParams  - (optional) the parameters of the entry point
 * @param {string} entryPoint                          - the entry point name
 * @param {object} tezosService                        - the tezos service
 *
 * @return {object} the taquito contract method class
 */
async function getContractMethodByTransactionDetails(
  { contractAddress, entryPoint, entryPointParams }: TransactionDetails,
  useCache: boolean,
  tezosService: TezosService,
  logger: Logger,
) {
  const contract = useCache
    ? await tezosService.getContractFromCache(contractAddress)
    : await tezosService.getContract(contractAddress);

  return getContractMethod(logger, contract, entryPoint, entryPointParams);
}

/**
 * Insert the transactions after successfully publish the transactions to the queue
 *
 * @param {object} postgreService   - the postgre service
 * @param {object[]} transactions   - the list of transactions with transaction details
 * @param {number} jobId            - the id of the job that dedicated to this request
 * @param {string} pkh              - the tezos address of the account that made the request
 */
async function insertTransactions(
  postgreService: PostgreService,
  transactions: TransactionDetails[],
  jobId: number,
  pkh: string,
  callerId: string,
) {
  await Promise.all(
    transactions.map(
      async ({ contractAddress, entryPoint, entryPointParams }) => {
        await insertTransactionWithParametersJson(postgreService.pool, {
          destination: contractAddress,
          source: pkh,
          parameters_json: {
            entrypoint: entryPoint,
            value: {
              [`${entryPoint}`]: entryPointParams ? entryPointParams : 0,
            },
          },
          jobId,
          callerId,
        });
      },
    ),
  );
}
