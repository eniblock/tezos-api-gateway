import _ from 'lodash';
import {
  ContractAbstraction,
  ContractProvider,
  MichelsonMap,
} from '@taquito/taquito';
import Logger from 'bunyan';

import {
  EntryPointParams,
  GenericObject,
} from '../../const/interfaces/forge-operation-params';
import {
  InvalidEntryPointParams,
  InvalidMapStructureParams,
} from '../../const/errors/invalid-entry-point-params';
import { MapObject } from '../../const/interfaces/contract-storage-response';

/**
 * Get the contract method
 *
 * @param {object} contract     - the smart contract containing the entry point
 * @param {string} entryPoint   - the entry point's name
 * @param {object | string | number } params    - (optional) the entry point parameter given by the API
 *
 * @return {ContractMethod} the contract method
 */
export function getContractMethod(
  logger: Logger,
  contract: ContractAbstraction<ContractProvider>,
  entryPoint: string,
  params?: EntryPointParams,
) {
  if (!params) {
    return contract.methods[`${entryPoint}`](0);
  }

  if (typeof params !== 'object' || Array.isArray(params)) {
    return contract.methods[`${entryPoint}`](params);
  }

  const paramsValues = Object.values(params);

  const schema = contract.methods[`${entryPoint}`].apply(
    null,
    paramsValues,
  ).schema;

  logger.info(
    { schema },
    '[lib/smart-contracts/#getContractMethod] Get the schema',
  );

  const entryPointArgs = computeEntryPointArgs(params, schema);

  if (entryPointArgs.length !== paramsValues.length) {
    throw new InvalidEntryPointParams(schema, params);
  }

  return contract.methods[`${entryPoint}`].apply(null, entryPointArgs);
}

/**
 * Get the transfer parameters of the given entry point
 *
 * @param {object} contract                     - the smart contract containing the entry point
 * @param {string} entryPoint                   - the entry point's name
 * @param {object | string | number } params    - (optional) the entry point parameter given by the API
 *
 * @return {object} the transfer parameter to Tezos Blockchain
 */
export function getTransferToParams(
  logger: Logger,
  contract: ContractAbstraction<ContractProvider>,
  entryPoint: string,
  params?: EntryPointParams,
) {
  return getContractMethod(
    logger,
    contract,
    entryPoint,
    params,
  ).toTransferParams();
}

/**
 * Generate an array of arguments which will be sent to Tezos blockchain base on the schema and the given parameters
 * The arguments order needs to strictly follow the order from the schema
 *
 * For example:
 * params = {
 *   destination: 'destination',
 *   token: 12,
 *   source: 'source'
 * }
 *
 * schema = {
 *   token: 'nat',
 *   source: 'address',
 *   destination: 'address',
 * }
 *
 * => result = [12, 'source', 'destination']
 *
 * @param {object} params    - the entry point parameters given by the API
 * @param {object} schema    - the entry point schema
 *
 * @return {unknown[]} an array of arguments that need to be sent to Tezos blockchain
 */
function computeEntryPointArgs(
  params: GenericObject,
  schema: GenericObject,
): unknown[] {
  const result: unknown[] = [];

  Object.keys(schema)
    .filter((argName) => params[`${argName}`] !== undefined)
    .forEach((argName) => {
      const type = schema[`${argName}`];

      result.push(
        typeof type === 'object'
          ? convertParameterToMap(params[`${argName}`] as MapObject[], argName)
          : params[`${argName}`],
      );
    });

  return result;
}

/**
 * Convert the parameter to a michelson map
 *
 * @param {object[]} mapParameter   - the map parameter that need to be converted
 *
 * @return {MichelsonMap} the corresponding Michelson Map
 */
function convertParameterToMap(mapParameter: MapObject[], mapName: string) {
  if (!Array.isArray(mapParameter)) {
    throw new InvalidMapStructureParams(mapName);
  }

  const result = new MichelsonMap();

  mapParameter.forEach((param) => {
    if (!_.isEqual(Object.keys(param), ['key', 'value'])) {
      throw new InvalidMapStructureParams(mapName);
    }

    result.set(param.key, param.value);
  });

  return result;
}
