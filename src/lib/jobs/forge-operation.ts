import _ from 'lodash';
import { OpKind } from '@taquito/rpc';
import { TransactionOperationParameter } from '@taquito/rpc/dist/types/types';

import { ForgeOperationParams } from '../../const/interfaces/forge-operation-params';
import { logger } from '../../services/logger';
import { getTransferToParams } from '../smart-contracts';
import { PostgreService } from '../../services/postgre';
import { Jobs } from '../../const/interfaces/jobs';
import { AddressNotFoundError } from '../../const/errors/address-not-found-error';
import { TezosService } from '../../services/tezos';
import { insertJob } from '../../models/jobs';
import { insertOperations } from '../../models/operations';
import { JobStatus } from '../../const/job-status';
import { FakeSigner } from '../../services/signers/fake-signer';
import {
  OperationContentsTransactionWithParametersJson,
  TransactionDetails,
} from '../../const/interfaces/send-transactions-params';
import { Estimate } from '@taquito/taquito/dist/types/contract/estimate';
import { ParamsWithKind } from '@taquito/taquito/dist/types/operations/types';

const FORGE_OPERATION_KNOWN_ERRORS = [
  'AddressNotFoundError',
  'InvalidEntryPointParams',
  'InvalidMapStructureParams',
];

type TransactionsDetailsWithMichelsonParameters = Omit<
  TransactionDetails,
  'entryPointParams'
> & {
  parameter?: TransactionOperationParameter;
};

/**
 * Return job object after forge the operation with the given data
 *
 * @param {string} contractAddress                     - the smart contract address on Tezos
 * @param {object | string | number} entryPointParams  - (optional) the parameters of the entry point
 * @param {string} entryPoint                          - the entry point name
 * @param {address} sourceAddress                      - the address of the account wanted to perform the call
 * @param {object} tezosService                        - the tezos service
 * @param {object} postgreService                      - the postgre service
 *
 * @return Promise<object> the created job
 */
export async function forgeOperation(
  forgeOperationParams: ForgeOperationParams,
  tezosService: TezosService,
  postgreService: PostgreService,
): Promise<Jobs> {
  try {
    logger.info(
      {
        forgeOperationParams,
      },
      '[lib/jobs/forgeOperation] Going to forge operation with this following parameters',
    );

    const params: OperationContentsTransactionWithParametersJson[] = await getOperationContentsTransactionWithParametersJson(
      tezosService,
      forgeOperationParams,
    );

    logger.info(
      { params },
      '[lib/jobs/forgeOperation] Form parameters to forge the operation',
    );

    const { branch, forgedOperation } = await tezosService.forgeOperations(
      params.map((param) => _.omit(param, 'parametersJson')),
    );
    logger.info(
      { forgedOperation },
      '[lib/jobs/forgeOperation] Successfully forged the operation',
    );

    const result = await insertJob(postgreService.pool, {
      forged_operation: forgedOperation,
      status: JobStatus.CREATED,
      operation_kind: OpKind.TRANSACTION,
    });
    const jobId = (result.rows[0] as Jobs).id;

    logger.info(
      { result: result.rows, jobId },
      '[lib/jobs/forgeOperation] Successfully create a job after forging operation',
    );

    await insertOperations(
      postgreService.pool,
      params,
      branch,
      jobId,
      forgeOperationParams.callerId ? forgeOperationParams.callerId : '',
    );

    logger.info(
      {
        forgeOperationParams,
        branch,
        jobId,
      },
      '[lib/jobs/forgeOperation] Successfully save parameters of forge function',
    );

    return result.rows[0] as Jobs;
  } catch (err) {
    if (FORGE_OPERATION_KNOWN_ERRORS.includes(err.constructor.name)) {
      throw err;
    }

    logger.error(
      { error: err },
      '[lib/jobs/forgeOperation] Unexpected error happened',
    );

    throw err;
  }
}

/**
 * Create the parameters as json format
 *
 * @param {object | string | number} entryPointParams  - (optional) the parameters of the entry point
 * @param {string} entryPoint                          - the entry point name
 *
 * @return {object} the parameter as json type
 */
function createParametersJson({
  entryPointParams,
  entryPoint,
}: TransactionDetails) {
  return {
    entrypoint: entryPoint,
    value: {
      [`${entryPoint}`]: entryPointParams ? entryPointParams : 0,
    },
  };
}

/**
 * Get the estimation about the transactions fee details
 * such as fee, storage limit and gas limit from tezos node
 *
 * @param {object} tezosService    - the tezos service
 * @param {string} contractAddress - the smart contract address on Tezos
 * @param {address} sourceAddress  - the address of the account wanted to perform the call
 * @param {object[]} transactionDetails       - the parameters of the transactions (entry point and entry point parameters) in Michelson format
 *
 * @return Promise<object[]> the details about fee, storage limit and gas limit of a group of transactions
 */
function getEstimationForNode(
  tezosService: TezosService,
  transactionDetails: TransactionsDetailsWithMichelsonParameters[],
): Promise<Estimate[]> {
  const paramsWithKind: ParamsWithKind[] = [];

  for (const { contractAddress, parameter } of transactionDetails) {
    paramsWithKind.push({
      kind: OpKind.TRANSACTION,
      to: contractAddress,
      parameter,
      amount: 0,
    });
  }

  return tezosService.tezos.estimate.batch(paramsWithKind);
}

/**
 * Form the operation transaction contents parameters
 *
 * @param {object} tezosService                        - the tezos service
 * @param {string} contractAddress                     - the smart contract address on Tezos
 * @param {object | string | number} entryPointParams  - (optional) the parameters of the entry point
 * @param {string} entryPoint                          - the entry point name
 * @param {address} sourceAddress                      - the address of the account wanted to perform the call
 *
 * @return Promise<object> the operation contents transaction
 */
async function getOperationContentsTransactionWithParametersJson(
  tezosService: TezosService,
  { transactions, sourceAddress, useCache }: ForgeOperationParams,
): Promise<OperationContentsTransactionWithParametersJson[]> {
  const { counter: counterAsString } = await tezosService.getContractResponse(
    sourceAddress,
  );

  if (!counterAsString) {
    throw new AddressNotFoundError(sourceAddress);
  }

  let counter = parseInt(counterAsString, 10);

  logger.info(
    { counter },
    '[lib/jobs/forge-operation/#getOperationContentsTransactionWithParametersJson] Find counter',
  );

  const parametersList: TransactionsDetailsWithMichelsonParameters[] = await Promise.all(
    transactions.map(async (transaction) => {
      const { parameter } = await getATransactionParameters(
        tezosService,
        transaction,
        useCache,
      );
      return { ...transaction, parameter };
    }),
  );

  logger.info(
    { parametersList },
    '[lib/jobs/forge-operation/#getOperationContentsTransactionWithParametersJson] Form a parameters as Michelson type list',
  );

  const signerToGetPKH = new FakeSigner(sourceAddress, '');

  tezosService.setSigner(signerToGetPKH);

  const estimations = await getEstimationForNode(tezosService, parametersList);

  return estimations.map((estimation, index) => {
    return {
      kind: OpKind.TRANSACTION,
      destination: transactions[index].contractAddress,
      parameters: parametersList[index].parameter,
      parametersJson: createParametersJson(transactions[index]),
      amount: '0',
      source: sourceAddress,
      counter: (++counter).toString(),
      fee: estimation.suggestedFeeMutez.toString(),
      storage_limit: estimation.storageLimit.toString(),
      gas_limit: estimation.gasLimit.toString(),
    };
  });
}

/**
 * Get parameters of a single transactions as Michelson type
 *
 * @param {object} tezosService                        - the tezos service
 * @param {string} contractAddress                     - the smart contract address on Tezos
 * @param {object | string | number} entryPointParams  - (optional) the parameters of the entry point
 * @param {string} entryPoint                          - the entry point name
 *
 * @return {object} the parameters of a transaction as Michelson type
 */
async function getATransactionParameters(
  tezosService: TezosService,
  { contractAddress, entryPoint, entryPointParams }: TransactionDetails,
  useCache: boolean,
) {
  const contract = useCache
    ? await tezosService.getContractFromCache(contractAddress)
    : await tezosService.getContract(contractAddress);

  return getTransferToParams(logger, contract, entryPoint, entryPointParams);
}
