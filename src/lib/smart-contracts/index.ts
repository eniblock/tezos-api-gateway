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
  // InvalidEntryPointParams,
  InvalidMapStructureParams,
} from '../../const/errors/invalid-entry-point-params';
import { MapObject } from '../../const/interfaces/contract-storage-response';

// tslint:disable-next-line:no-var-requires
const createToken = require('@taquito/michelson-encoder/dist/lib/tokens/createToken');
// tslint:disable-next-line:no-var-requires
const or = require('@taquito/michelson-encoder/dist/lib/tokens/or');
// tslint:disable-next-line:no-var-requires
const map = require('@taquito/michelson-encoder/dist/lib/tokens/map');
// tslint:disable-next-line:no-var-requires
const list = require('@taquito/michelson-encoder/dist/lib/tokens/list');
// tslint:disable-next-line:no-var-requires
const pair = require('@taquito/michelson-encoder/dist/lib/tokens/pair');

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

  if (!(typeof params === 'object' || Array.isArray(params))) {
    return contract.methods[`${entryPoint}`](params);
  }

  // const paramsValues = Object.values(params);
  // const schema = contract.methods[`${entryPoint}`].apply(null, paramsValues)
  // const schema1 = contract.methods[`${entryPoint}`].apply(null, [params]) .schema;
  const schema = contract.parameterSchema.ExtractSchema()[`${entryPoint}`];
  const michelsonSchema = contract.entrypoints.entrypoints[`${entryPoint}`];

  logger.info(
    { schema },
    '[lib/smart-contracts/#getContractMethod] Get the schema',
  );

  const entryPointArgs = computeEntryPointArgs(params, schema, michelsonSchema);

  // TODO useless?!
  // const paramsValues = Object.values(params);
  /*if (entryPointArgs.length !== paramsValues.length) {
    throw new InvalidEntryPointParams(schema, params);
  }*/

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
  params: EntryPointParams,
  schema: GenericObject,
  mickelsonSchema: object,
): unknown[] {
  const result: unknown[] = [];

  if (!(typeof params === 'object' || Array.isArray(params))) {
    return [params];
  }

  // TODO
  //  Dont forget to try the upgrade of Taquito version

  const token = createToken.createToken(mickelsonSchema, 0);
  if (Array.isArray(params)) {
    if (token instanceof map.MapToken) {
      return [convertParameterToMap(params as MapObject[])];
    } else if (token instanceof list.ListToken) {
      return [params];
    }
  } else {
    if (token instanceof or.OrToken) {
      // TODO verify that is a single entry
      return Object.entries(params)[0];
    } else if (token instanceof pair.PairToken) {
      Object.keys(schema)
        .filter((argName) => params[`${argName}`] !== undefined)
        .forEach((argName) => {
          result.push(params[`${argName}`]);
        });
      return result;
    }
  }

  return result; // TODO delete replace by throwing an error
}

/**
 * Convert the parameter to a michelson map
 *
 * @param {object[]} mapParameter   - the map parameter that need to be converted
 *
 * @return {MichelsonMap} the corresponding Michelson Map
 */
function convertParameterToMap(mapParameter: MapObject[]) {
  if (!Array.isArray(mapParameter)) {
    throw new InvalidMapStructureParams();
  }

  const result = new MichelsonMap();

  mapParameter.forEach((param) => {
    if (!_.isEqual(Object.keys(param), ['key', 'value'])) {
      throw new InvalidMapStructureParams();
    }

    result.set(param.key, param.value);
  });

  return result;
}
