import _ from 'lodash';
import BigNumber from 'bignumber.js';
import { BigMapAbstraction, MichelsonMap } from '@taquito/taquito';
import { MichelsonMapKey } from '@taquito/michelson-encoder/dist/types/michelson-map';

import { GenericObject } from '../../const/interfaces/forge-operation-params';
import {
  ContractStorageDataType,
  ContractStorageResponse,
  MapObject,
} from '../../const/interfaces/contract-storage-response';

/**
 * Generate an array of object containing key and value of a michelson map
 *
 * @param { MichelsonMap } map   - the michelson map need to be convert
 *
 * @return { object[] } an array of all keys and values in the map
 */
export function convertMichelsonMapToArrayObject(
  map: MichelsonMap<MichelsonMapKey, unknown>,
) {
  const result: MapObject[] = [];

  const mapEntriesGenerator = map.entries();

  while (true) {
    const { value: mapEntry } = mapEntriesGenerator.next();

    if (!mapEntry) {
      break;
    }

    const value =
      typeof mapEntry[1] === 'object'
        ? generateStorageResponse(mapEntry[1])
        : convertStorageValueToStorageResponseValue(mapEntry[1]);

    result.push({
      key: mapEntry[0],
      value,
    });
  }

  return result;
}

/**
 * Convert the contract storage value to a storage response value depending on its type
 *
 * @param {unknown} value  - the value of the contract storage
 *
 * @return {object | string | number} the storage response value regarding the value
 */
export function convertStorageValueToStorageResponseValue(value: unknown): any {
  if (value instanceof MichelsonMap) {
    const map = value as MichelsonMap<MichelsonMapKey, unknown>;

    return convertMichelsonMapToArrayObject(map);
  }

  if (value instanceof BigMapAbstraction) {
    return {
      type: ContractStorageDataType.BIG_MAP,
      value: (value as BigMapAbstraction).toString(),
    };
  }

  if (value instanceof BigNumber) {
    return (value as BigNumber).toNumber();
  }

  if (Array.isArray(value)) {
    return value.map((elt) => {
      return convertStorageValueToStorageResponseValue(elt);
    });
  }

  if (value && typeof value === 'object') {
    return generateStorageResponse(value as GenericObject);
  }

  return value;
}

/**
 * Generate an object corresponding to the contract storage
 * Transfer the MichelsonMap and BigMap type to have a clearer response
 * Also transfer BigNumber to number to have the correct type
 *
 * @param {object} storage     - the storage retrieved from Tezos
 *
 * @return {object} the contract storage response with the following format:
 * {
 *     [key: string]: {
 *         type: 'big_map' | 'map';
 *         size?: number;
 *         value?: unknown
 *     } | string | number | boolean;
 * }
 */
export function generateStorageResponse(
  storage: GenericObject,
): ContractStorageResponse {
  const entries = Object.entries(storage).map(([key, value]) => {
    return [key, convertStorageValueToStorageResponseValue(value)];
  });

  return _.fromPairs(entries) as ContractStorageResponse;
}
