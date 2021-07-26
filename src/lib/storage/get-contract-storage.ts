import Logger from 'bunyan';

import { TezosService } from '../../services/tezos';
import { GenericObject } from '../../const/interfaces/forge-operation-params';
import { ClientError } from '../../const/errors/client-error';
import { ContractStorageRequestDataField } from '../../const/interfaces/contract-storage-request-datafield';
import { generateStorageResponse } from './generate-storage-response';
import { convertStorage } from './convert-storage';

/**
 * Get the contract storage object from tezos node by using taquito
 *
 * @param tezosService
 * @param contractAddress
 *
 * @return Promise<object> the storage object
 */
export async function getContractStorageFromTezosNode(
  logger: Logger,
  tezosService: TezosService,
  contractAddress: string,
): Promise<GenericObject> {
  try {
    const contract = await tezosService.getContractFromCache(contractAddress);

    return contract.storage();
  } catch (err) {
    if (err.status >= 400 && err.status < 500) {
      logger.info(
        { contractAddress, message: err.message },
        '[lib/storage/get-contract-storage/#getContractStorageFromTezosNode] A client error happened while retrieving contract storage from tezos node',
      );
      throw new ClientError(err);
    }

    logger.error(
      { contractAddress, message: err.message },
      '[lib/storage/get-contract-storage/#getContractStorageFromTezosNode] Unexpected error',
    );
    throw err;
  }
}

export async function getContractStorageObjectFromTezosNode(
  logger: Logger,
  tezosService: TezosService,
  contractAddress: string,
  dataFields?: ContractStorageRequestDataField[],
) {
  const storage = await getContractStorageFromTezosNode(
    logger,
    tezosService,
    contractAddress,
  );

  logger.info(
    { contractAddress, storage },
    '[lib/storage/getContractStorage/#getContractStorageObjectFromTezosNode] Retrieve the storage for the smart contract',
  );

  if (!dataFields) {
    return generateStorageResponse(storage);
  }

  return convertStorage(logger, dataFields, storage);
}
