import _ from 'lodash';
import { OperationContentsTransaction, OpKind } from '@taquito/rpc';
import {
  OperationContentsReveal,
  TransactionOperationParameter,
} from '@taquito/rpc/dist/types/types';

import { ForgeOperationParams } from '../../const/interfaces/forge-operation-params';
import { logger } from '../../services/logger';
import { getTransferToParams } from '../smart-contracts';
import { PostgreService } from '../../services/postgre';
import { Jobs, TransactionJobsResults } from '../../const/interfaces/jobs';
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
import { ParamsWithKind } from '@taquito/taquito/dist/types/operations/types';
import { estimateAndBuildRevealOperation } from './forge-reveal-operation';
import { AddressNotRevealedError } from '../../const/errors/address-not-revealed';
import { AddressAlreadyRevealedError } from '../../const/errors/address-already-revealed';
import { MaxOperationsPerBatchError } from '../../const/errors/max-operations-per-batch-error';
import { gasLimitMargin, maxOperationsPerBatch } from '../../config';
import { Estimate, TezosOperationError } from '@taquito/taquito';

export const FORGE_OPERATION_KNOWN_ERRORS = [
  'AddressAlreadyRevealedError',
  'AddressNotFoundError',
  'InvalidMapStructureParams',
  'InvalidParameterName',
  'InvalidParameter',
  'MissingParameter',
  'UnSupportedParameterSchema',
  'InvalidVariantObject',
  'AddressNotRevealedError',
  'RevealEstimateError',
  'InvalidBooleanParameter',
  'AddressValidationError',
  'BigMapValidationError',
  'BytesValidationError',
  'ChainIDValidationError',
  'ContractValidationError',
  'IntValidationError',
  'KeyHashValidationError',
  'KeyValidationError',
  'ListValidationError',
  'MapValidationError',
  'MutezValidationError',
  'NatValidationError',
  'SetValidationError',
  'SignatureValidationError',
  'TezosOperationError',
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
): Promise<TransactionJobsResults> {
  try {
    logger.info(
      {
        forgeOperationParams,
      },
      '[lib/jobs/forgeOperation] Going to forge operation with the following parameters',
    );

    let { operationsToForge, operationsToInsert } = await addRevealOpIfNeeded(
      tezosService,
      forgeOperationParams,
    );

    if (
      forgeOperationParams.transactions.length === maxOperationsPerBatch &&
      operationsToForge.length > 0
    )
      throw new MaxOperationsPerBatchError();

    const params: OperationContentsTransactionWithParametersJson[] =
      await getOperationContentsTransactionWithParametersJson(
        tezosService,
        forgeOperationParams,
      );

    operationsToInsert = operationsToInsert.concat(params);
    operationsToForge = operationsToForge.concat(
      params.map((param) => _.omit(param, 'parametersJson')),
    );

    logger.info(
      { params },
      '[lib/jobs/forgeOperation] Form parameters to forge the operation',
    );

    const fee = operationsToForge.reduce((acc, op) => {
      return acc + Number(op.fee);
    }, 0);
    const gas = operationsToForge.reduce((acc, op) => {
      return acc + Number(op.gas_limit) - gasLimitMargin;
    }, 0);

    const { branch, forgedOperation } = await tezosService.forgeOperations(
      operationsToForge,
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
      operationsToInsert,
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

    return { ...result.rows[0], fee, gas };
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
export function createParametersJson({
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
export function getEstimationForNode(
  tezosService: TezosService,
  transactionDetails: TransactionsDetailsWithMichelsonParameters[],
): Promise<Estimate[]> {
  const paramsWithKind: ParamsWithKind[] = [];

  for (const { contractAddress, parameter, amount } of transactionDetails) {
    paramsWithKind.push({
      kind: OpKind.TRANSACTION,
      to: contractAddress,
      parameter,
      amount: amount ? amount : 0,
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
  {
    transactions,
    sourceAddress,
    publicKey,
    useCache,
    reveal,
  }: ForgeOperationParams,
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

  // getEstimationForNode() requires the publicKey if a reveal is needed
  // but fails if the publicKey is set when a reveal is not needed.
  if (!reveal) publicKey = '';

  const signerToGetPKH = new FakeSigner(sourceAddress, publicKey!);

  tezosService.setSigner(signerToGetPKH);

  const parametersList: TransactionsDetailsWithMichelsonParameters[] =
    await Promise.all(
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
  let estimations: Estimate[];

  try {
    estimations = await getEstimationForNode(tezosService, parametersList);
  } catch (err) {
    logger.error(
      { error: err },
      '[lib/jobs/forgeOperation#getOperationContentsTransactionWithParametersJson] Unexpected error happened during estimation',
    );
    if (err instanceof TezosOperationError) {
      throw err;
    } else {
      throw new AddressNotRevealedError(sourceAddress);
    }
  }

  // Taquito automatically adds the reveal estimation but we don't need it here
  if (reveal && estimations.length > transactions.length) {
    counter++;
    estimations.shift();
  }

  return estimations.map((estimation, index) => {
    return {
      kind: OpKind.TRANSACTION,
      destination: transactions[index].contractAddress,
      parameters: parametersList[index].parameter,
      parametersJson: createParametersJson(transactions[index]),
      amount: parametersList[index].amount
        ? `${parametersList[index].amount}`
        : '0',
      source: sourceAddress,
      counter: (++counter).toString(),
      fee: parametersList[index].fee
        ? `${parametersList[index].fee}`
        : estimation.suggestedFeeMutez.toString(),
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
 * @param amount
 * @param fee
 * @param useCache
 * @return {object} the parameters of a transaction as Michelson type
 */
export async function getATransactionParameters(
  tezosService: TezosService,
  {
    contractAddress,
    entryPoint,
    entryPointParams,
    amount,
    fee,
  }: TransactionDetails,
  useCache: boolean,
) {
  const contract = useCache
    ? await tezosService.getContractFromCache(contractAddress)
    : await tezosService.getContract(contractAddress);

  return getTransferToParams(
    logger,
    contract,
    entryPoint,
    entryPointParams,
    amount,
    fee,
  );
}

/**
 * Prepare operations lists to be forged and inserted in DB
 * Add the reveal operation if necessary
 *
 * @param {object} tezosService             - the tezos service
 * @param {object} forgeOperationParams     - the params passed to forge the operations
 *
 * @return {object[], object[]} the list of operations to forge and insert
 */
async function addRevealOpIfNeeded(
  tezosService: TezosService,
  forgeOperationParams: ForgeOperationParams,
) {
  const operationsToForge: (
    | OperationContentsTransaction
    | OperationContentsReveal
  )[] = [];

  const operationsToInsert: (
    | OperationContentsTransactionWithParametersJson
    | OperationContentsReveal
  )[] = [];

  if (
    forgeOperationParams.reveal &&
    forgeOperationParams.publicKey !== undefined
  ) {
    const signerToGetPKH = new FakeSigner(
      forgeOperationParams.sourceAddress,
      forgeOperationParams.publicKey,
    );
    tezosService.setSigner(signerToGetPKH);

    try {
      const revealOp = await estimateAndBuildRevealOperation(
        tezosService,
        forgeOperationParams.sourceAddress,
        forgeOperationParams.publicKey,
      );

      operationsToForge.push(revealOp);
      operationsToInsert.push(revealOp);
    } catch (err) {
      // If address is already revealed we continue
      if (!(err instanceof AddressAlreadyRevealedError)) {
        throw err;
      }
    }
  }

  return { operationsToForge, operationsToInsert };
}
