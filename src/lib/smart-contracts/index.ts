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
  InvalidMapStructureParams,
  InvalidParameterName,
  InvalidVariantObject,
  UnKnownParameterType,
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
// tslint:disable-next-line:no-var-requires
const opt = require('@taquito/michelson-encoder/dist/lib/tokens/option');
// // tslint:disable-next-line:no-var-requires
// const tok = require('@taquito/michelson-encoder/dist/lib/tokens/token');
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

  const schema = contract.parameterSchema.ExtractSchema()[`${entryPoint}`];
  const mickelsonSchema = contract.entrypoints.entrypoints[`${entryPoint}`];

  logger.info(
    { schema },
    '[lib/smart-contracts/#getContractMethod] Get the schema',
  );

  const token = createToken.createToken(mickelsonSchema, 0);

  const entryPointArgs = formatEntryPointParameters(params, token);

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
 * @param token
 *
 * @return {unknown[]} an array of arguments that need to be sent to Tezos blockchain
 */
function formatEntryPointParameters(
  params: EntryPointParams,
  token: any,
): unknown[] {
  if (token instanceof opt.OptionToken) {
    if (params === null) {
      return [params];
    } else {
      return formatEntryPointParameters(
        params,
        token.createToken(token.val.args[0], 0),
      );
    }
  } else {
    if (Array.isArray(params)) {
      if (token instanceof map.MapToken) {
        return formatMapParameter(params as MapObject[], token);
      } else if (token instanceof list.ListToken) {
        return formatListParameter(params, token);
      } else {
        throw new UnKnownParameterType(typeof token);
      }
    } else if (typeof params === 'object') {
      if (token instanceof or.OrToken) {
        return formatVariantParameter(params, token);
      } else if (token instanceof pair.PairToken) {
        return formatRecordParameter(params, token);
      } else {
        throw new UnKnownParameterType(typeof token);
      }
    } else {
      // simple parameter: number, string, address, bytes, bool...
      return [params];
    }
  }
}

function formatVariantParameter(params: GenericObject, token: any) {
  if (Object.keys(params).length !== 1) {
    throw new InvalidVariantObject(Object.keys(params).length);
  }
  const variantName = Object.keys(params)[0];
  // extract Michelson child object
  const variantToken = findChildTokenByAnnotation(
    token,
    variantName,
    or.OrToken,
  );
  if (!variantToken) {
    throw new InvalidParameterName(variantName);
  }

  return [
    variantName,
    ...formatEntryPointParameters(
      params[variantName] as EntryPointParams,
      variantToken,
    ),
  ];
}

function formatListParameter(params: unknown[], token: any) {
  let result: unknown[] = [];
  const childToken = token.createToken(token.val.args[0], 0);
  params.forEach((elt) => {
    result = [
      ...result,
      ...formatEntryPointParameters(elt as EntryPointParams, childToken),
    ];
  });
  return [result];
}

/*function formatOptionParameter(params: GenericObject, token: any) {
}*/

function formatRecordParameter(params: GenericObject, token: any) {
  let result: unknown[] = [];
  Object.keys(params)
    .filter((argName) => params[`${argName}`] !== undefined)
    .forEach((argName) => {
      const childToken = findChildTokenByAnnotation(
        token,
        argName,
        pair.PairToken,
      );
      if (!childToken) {
        throw new InvalidParameterName(argName);
      }
      result = [
        ...result,
        ...formatEntryPointParameters(
          params[`${argName}`] as EntryPointParams,
          childToken,
        ),
      ];
    });
  return result;
}

/**
 * Convert the parameter to a michelson map
 *
 * @param {object[]} mapParameter   - the map parameter that need to be converted
 *
 * @param token
 * @return {MichelsonMap} the corresponding Michelson Map
 */
function formatMapParameter(mapParameter: MapObject[], token: any) {
  if (!Array.isArray(mapParameter)) {
    throw new InvalidMapStructureParams();
  }

  const result = new MichelsonMap();

  mapParameter.forEach((param) => {
    if (!_.isEqual(Object.keys(param), ['key', 'value'])) {
      throw new InvalidMapStructureParams();
    }
    const keyToken = token.createToken(token.val.args[0], 0);
    const valueToken = token.createToken(token.val.args[1], 0);

    result.set(
      formatEntryPointParameters(param.key as EntryPointParams, keyToken),
      formatEntryPointParameters(param.value as EntryPointParams, valueToken),
    );
  });

  return [result];
}

function findChildTokenByAnnotation(
  token: any,
  paramName: string,
  tokenType: any,
): any {
  for (const arg of token.val.args) {
    const childToken = token.createToken(arg, 0);
    if (childToken.annot() === paramName) {
      return childToken;
    } else if (childToken instanceof tokenType) {
      const res = findChildTokenByAnnotation(childToken, paramName, tokenType);
      if (res) return res;
    }
  }
}
