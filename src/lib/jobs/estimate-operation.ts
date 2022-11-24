import { OpKind } from '@taquito/rpc';
import { TransactionOperationParameter } from '@taquito/rpc/dist/types/types';

import { ForgeOperationParams } from '../../const/interfaces/forge-operation-params';
import { logger } from '../../services/logger';
import { AddressNotFoundError } from '../../const/errors/address-not-found-error';
import { TezosService } from '../../services/tezos';
import { FakeSigner } from '../../services/signers/fake-signer';
import { TransactionDetails } from '../../const/interfaces/send-transactions-params';
import { AddressNotRevealedError } from '../../const/errors/address-not-revealed';
import { MaxOperationsPerBatchError } from '../../const/errors/max-operations-per-batch-error';
import { maxOperationsPerBatch } from '../../config';
import { Estimate, TezosOperationError } from '@taquito/taquito';
import {
  createParametersJson,
  FORGE_OPERATION_KNOWN_ERRORS,
  getATransactionParameters,
  getEstimationForNode,
} from './forge-operation';
import { Estimation } from '../../const/interfaces/estimation';

type TransactionsDetailsWithMichelsonParameters = Omit<
  TransactionDetails,
  'entryPointParams'
> & {
  parameter?: TransactionOperationParameter;
};

/**
 * Return operation estimations with the given data
 *
 * @param {string} contractAddress                     - the smart contract address on Tezos
 * @param {object | string | number} entryPointParams  - (optional) the parameters of the entry point
 * @param {string} entryPoint                          - the entry point name
 * @param {address} sourceAddress                      - the address of the account wanted to perform the call
 * @param {object} tezosService                        - the tezos service
 *
 * @return Promise<object> the created job
 */
export async function estimateOperation(
  estimateOperationParams: ForgeOperationParams,
  tezosService: TezosService,
): Promise<Estimation[]> {
  try {
    logger.info(
      {
        estimateOperationParams,
      },
      '[lib/jobs/estimateOperation] Going to estimate operation with the following parameters',
    );

    const {
      transactions,
      sourceAddress,
      publicKey,
      useCache,
      reveal,
    }: ForgeOperationParams = estimateOperationParams;

    const { counter: counterAsString } = await tezosService.getContractResponse(
      sourceAddress,
    );

    if (!counterAsString) {
      throw new AddressNotFoundError(sourceAddress);
    }

    let counter = parseInt(counterAsString, 10);

    logger.info({ counter }, '[lib/jobs/estimateOperation] Find counter');

    const signerToGetPKH = new FakeSigner(
      sourceAddress,
      reveal ? publicKey!! : '',
    );

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
      '[lib/jobs/estimateOperation] Form a parameters as Michelson type list',
    );
    let estimations: Estimate[];

    try {
      estimations = await getEstimationForNode(tezosService, parametersList);
    } catch (err) {
      logger.error(
        { error: err },
        '[lib/jobs/estimationOperation] Unexpected error happened during estimation',
      );
      if (err instanceof TezosOperationError) {
        throw err;
      } else {
        throw new AddressNotRevealedError(sourceAddress);
      }
    }
    let result: Estimation[] = [];
    if (reveal && estimations.length > transactions.length) {
      if (estimations.length > maxOperationsPerBatch)
        throw new MaxOperationsPerBatchError();
      result = [
        {
          kind: OpKind.REVEAL,
          source: sourceAddress,
          public_key: publicKey,
          counter: ++counter,
          suggestedFee: estimations[0].suggestedFeeMutez,
          minimalFee: estimations[0].minimalFeeMutez,
          gasEstimation: Math.round(estimations[0].consumedMilligas / 1000),
          gasLimit: estimations[0].gasLimit,
          storageLimit: estimations[0].storageLimit,
          storageAndAllocationFee: estimations[0].burnFeeMutez,
        },
      ];
      estimations.shift();
    }

    return [
      ...result,
      ...estimations.map((estimation, index) => {
        return {
          kind: OpKind.TRANSACTION,
          destination: transactions[index].contractAddress,
          parameters: parametersList[index].parameter,
          parametersJson: createParametersJson(transactions[index]),
          amount: parametersList[index].amount
            ? parametersList[index].amount
            : 0,
          source: sourceAddress,
          counter: ++counter,
          suggestedFee: estimation.suggestedFeeMutez,
          minimalFee: estimation.minimalFeeMutez,
          gasEstimation: Math.round(estimation.consumedMilligas / 1000),
          gasLimit: estimation.gasLimit,
          storageLimit: estimation.storageLimit,
          storageAndAllocationFee: estimation.burnFeeMutez,
        };
      }),
    ];
  } catch (err) {
    if (FORGE_OPERATION_KNOWN_ERRORS.includes(err.constructor.name)) {
      throw err;
    }

    logger.error(
      { error: err },
      '[lib/jobs/estimateOperation] Unexpected error happened',
    );

    throw err;
  }
}
