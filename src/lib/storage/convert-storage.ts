import { MichelsonMapKey } from '@taquito/michelson-encoder/dist/types/michelson-map';
import { BigMapAbstraction, MichelsonMap } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import Logger from 'bunyan';
import _ from 'lodash';
import {
  ContractStorageRequestDataField,
  DeepLayerDataField,
} from '../../const/interfaces/contract-storage-request-datafield';
import { GenericObject } from '../../const/interfaces/forge-operation-params';
import {
  convertStorageValueToStorageResponseValue,
  generateStorageResponse,
} from './generate-storage-response';

/**
 * Given a smart contract map (MichelsonMap or BigMap),
 * and also a list of fields that need to get from the map
 * return the correct array of key value corresponding to the fields
 *
 * For example:
 * map = MichelsonMap(
 *    {
 *        adddress: 'toto'
 *    }: {
 *        name: 'Alice',
 *        age: 49,
 *        status: 'funny'
 *    },
 *    {
 *        address: 'tata'
 *    }: {
 *        name: 'Bob',
 *        age: 30,
 *        status: 'rich'
 *    }
 * )
 * rootDataFields = [
 *    {
 *        key: { address: 'toto' }
 *    },
 *    {
 *        key: { address: 'toto' },
 *        dataFields: [
 *            'name'
 *        ]
 *    }
 * ]
 *
 * => result = [
 *    {
 *        key: { address: 'toto' },
 *        value: {
 *          name: 'Alice',
 *          age: 49,
 *          status: 'funny'
 *        },
 *    },
 *    {
 *        key: { address: 'toto' },
 *        value: {
 *          name: 'Bob'
 *        },
 *    }
 * ]
 *
 * @param {object} logger                         - the logger
 * @param {object[]}rootDataFields                - the list of data that need to get from the map
 * @param {MichelsonMap | BigMapAbstraction} map  - the map that contains the data
 *
 * @return {object[]} an array of key value object corresponding the list of data fields requested
 */
function convertDeepLayerDataFieldToStorageResponseValue(
  logger: Logger,
  rootDataFields: DeepLayerDataField[],
  map: MichelsonMap<MichelsonMapKey, any> | BigMapAbstraction,
) {
  logger.info(
    { rootDataFields, map },
    '[lib/storage/convert-storage/#convertDeepLayerDataFieldToStorageResponseValue] Going to get these fields from the map',
  );

  return Promise.all(
    rootDataFields.map(async ({ key, dataFields }) => {
      let mapValue = null;
      mapValue =
        map instanceof MichelsonMap
          ? map.get(key)
          : await tryGetFromMap(logger, map, key, 3);

      if (!mapValue) {
        return { key, error: 'The current map does not contain this key' };
      }

      if (dataFields) {
        return {
          key,
          value: await convertStorage(logger, dataFields, mapValue),
        };
      }

      if (mapValue instanceof BigNumber) {
        return {
          key,
          value: mapValue.toNumber(),
        };
      }

      return {
        key,
        value:
          typeof mapValue === 'object'
            ? generateStorageResponse(mapValue)
            : mapValue,
      };
    }),
  );
}

/**
 * The map.get function often returns a 502 error (for unknown reasons, maybe because we request the node too much).
 * If we get a 502 we retry at most 3 times.
 * There is no need for a timeout between each call, because the 502 has the same effect.
 *
 * @param {object} logger                         - the logger
 * @param {MichelsonMap | BigMapAbstraction} map  - the map that contains the data
 * @param {string | GenericObject} key            - the key of the data we wish to retrieve
 * @param {number} remainingAttempts              - the number of attempts remaining
 */
async function tryGetFromMap(
  logger: Logger,
  map: MichelsonMap<MichelsonMapKey, any> | BigMapAbstraction,
  key: string | GenericObject,
  remainingAttempts: number,
): Promise<any> {
  try {
    return await map.get(key as any);
  } catch (err) {
    if (err.status === 502 && remainingAttempts > 0) {
      logger.error(
        '[lib/storage/convert-storage/#tryGetFromMap] Got a 502, retrying - Error : ' +
          err.message,
      );
      return tryGetFromMap(logger, map, key, remainingAttempts - 1);
    }
    logger.error('Key Not Found in Map - errorStatus : ' + err.status);
    throw err;
  }
}

/**
 * Handle the case when the request data field of the storage object/map is an object (not a string)
 * Which means the field must be a Map
 * Set an error if the field is not a Map
 *
 * @param {object} logger       - the logger
 * @param {object} dataField    - the data that need to get from the storage
 * @param {object} storage      - the storage
 *
 * @return {object[]} an array of key value object corresponding the list of data fields requested
 */
async function handleObjectDataField(
  logger: Logger,
  dataField: { [key: string]: DeepLayerDataField[] },
  storage: GenericObject,
) {
  const [[dataFieldKey, dataFieldValue]] = Object.entries(dataField);

  const storageValue = storage[`${dataFieldKey}`];

  if (!storageValue) {
    return [
      `${dataFieldKey}`,
      {
        error: 'This data field does not exist in the contract storage',
      },
    ];
  }

  if (
    !(storageValue instanceof BigMapAbstraction) &&
    !(storageValue instanceof MichelsonMap)
  ) {
    return [
      `${dataFieldKey}`,
      {
        error:
          'This data field does not have type MichelsonMap or BigMap, use simple string to access to the properties',
      },
    ];
  }

  return [
    dataFieldKey,
    await convertDeepLayerDataFieldToStorageResponseValue(
      logger,
      dataFieldValue,
      storageValue,
    ),
  ];
}

/**
 * Convert the smart contract storage to another object that have more details regarding the map and big map
 * And also return only the requested data fields which appeared in dataFields list
 *
 * @param {object} logger       - the logger
 * @param {object[]} dataFields - the list of fields that need to get from the storage
 * @param {object} storage      - the storage
 *
 * @return {object} the storage response after filtering the needed data
 */
export async function convertStorage(
  logger: Logger,
  dataFields: ContractStorageRequestDataField[],
  storage: GenericObject,
): Promise<GenericObject> {
  try {
    const resultEntries = await Promise.all(
      dataFields
        .filter((dataField) => !_.isEmpty(dataField))
        .map(async (dataField) => {
          if (typeof dataField === 'object') {
            return handleObjectDataField(logger, dataField, storage);
          }

          if (!_.has(storage, dataField)) {
            // If dataField is null or undefined
            return [
              `${dataField}`,
              {
                error: 'This data field does not exist in the contract storage',
              },
            ];
          }

          return [
            dataField,
            convertStorageValueToStorageResponseValue(
              _.get(storage, dataField),
            ),
          ];
        }),
    );

    return _.fromPairs(resultEntries);
  } catch (err) {
    logger.error(
      { storage, dataFields, message: err.message },
      '[lib/storage/convert-storage/#convertStorage] Unexpected error while trying to form the storage response corresponding to the dataFields',
    );
    throw err;
  }
}
