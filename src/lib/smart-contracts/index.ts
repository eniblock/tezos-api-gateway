import _ from 'lodash';
import {
  ContractAbstraction,
  ContractMethod,
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
  InvalidParameter,
  InvalidParameterName,
  InvalidVariantObject,
  MissingParameter,
  UnSupportedParameterSchema,
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
const set = require('@taquito/michelson-encoder/dist/lib/tokens/set');
// tslint:disable-next-line:no-var-requires
const pair = require('@taquito/michelson-encoder/dist/lib/tokens/pair');
// tslint:disable-next-line:no-var-requires
const opt = require('@taquito/michelson-encoder/dist/lib/tokens/option');
/**
 * Get the contract method
 *
 * @param logger
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
): ContractMethod<ContractProvider> {
  if (!params) {
    if (params === null) {
      return contract.methods[`${entryPoint}`].apply(null, []);
    } else {
      return contract.methods[`${entryPoint}`].apply(null, [0]);
    }
  }

  if (!(typeof params === 'object' || Array.isArray(params))) {
    return contract.methods[`${entryPoint}`](params);
  }

  const schema = contract.parameterSchema.ExtractSchema()[`${entryPoint}`];
  const mickelsonSchema = contract.entrypoints.entrypoints[`${entryPoint}`];
  const token = createToken.createToken(mickelsonSchema, 0);

  logger.info(
    token.ExtractSignature(),
    '[lib/smart-contracts/#getContractMethod] Get the parameters signature',
  );

  const entryPointParameters = formatEntryPointParameters(
    params,
    token,
    false,
    schema,
  );

  logger.info(
    entryPointParameters,
    '[lib/smart-contracts/#getContractMethod] Get the formatted parameters',
  );

  return contract.methods[`${entryPoint}`].apply(null, entryPointParameters);
}

/**
 * Get the transfer parameters of the given entry point
 *
 * @param logger
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
 * In the case of list the object is passed as it is and only maps are formatted
 *
 * For example:
 * params = [
 *  {
 *     destination: 'destination',
 *     token: 12,
 *     source: 'source'
 *  }
 * ]
 *
 * schema = "list"
 *
 * result = [
 *  {
 *     destination: 'destination',
 *     token: 12,
 *     source: 'source'
 *  }
 * ]
 *
 * @param {object} params    - the entry point parameters given by the API
 * @param token              - Taquito typed representation of parameters
 * @param onlyFormatMaps     - set to true when the root object is a list
 * @param schema             - parameters json schema
 * @return {unknown[]} an array of arguments that need to be sent to Tezos blockchain
 */
export function formatEntryPointParameters(
  params: EntryPointParams,
  token: any,
  onlyFormatMaps: boolean,
  schema?: GenericObject,
): unknown[] {
  if (token instanceof opt.OptionToken) {
    return formatOptionParameter(params, token, onlyFormatMaps, schema);
  }

  if (!Array.isArray(params) && typeof params !== 'object') {
    return [params];
  }

  if (token instanceof map.MapToken) {
    return formatMapParameter(
      params as MapObject[],
      token,
      onlyFormatMaps,
      schema,
    );
  }

  if (token instanceof list.ListToken || token instanceof set.SetToken) {
    return formatListOrSetParameter(params, token);
  }

  if (token instanceof or.OrToken) {
    return formatVariantParameter(params, token, onlyFormatMaps, schema);
  }

  if (token instanceof pair.PairToken) {
    return formatRecordParameter(params, token, onlyFormatMaps, schema);
  }

  throw new UnSupportedParameterSchema(token.ExtractSchema());
}

/**
 * Format option parameters
 *
 *
 * @param params     - Record object
 * @param token
 * @param onlyFormatMaps
 * @param schema
 * @return {MichelsonMap} the corresponding Michelson Map
 */
function formatOptionParameter(
  params: EntryPointParams,
  token: any,
  onlyFormatMaps: boolean,
  schema?: GenericObject,
) {
  if (params === null) {
    return [params];
  } else {
    return formatEntryPointParameters(
      params,
      token.createToken(token.val.args[0], 0),
      onlyFormatMaps,
      schema,
    );
  }
}

/**
 * Format variant parameters by prefixing the parameters with the variant name
 *
 *
 * @param params     - Record object
 * @param token
 * @param onlyFormatMaps
 * @param schema
 * @return {MichelsonMap} the corresponding Michelson Map
 */
function formatVariantParameter(
  params: EntryPointParams,
  token: any,
  onlyFormatMaps: boolean,
  schema?: GenericObject,
) {
  if (Array.isArray(params)) {
    throw new InvalidParameter('array', 'object');
  }

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
  if (onlyFormatMaps) {
    return [
      {
        [variantName]: formatEntryPointParameters(
          (params as GenericObject)[variantName] as EntryPointParams,
          variantToken,
          onlyFormatMaps,
        )[0],
      },
    ];
  }

  return [
    variantName,
    ...formatEntryPointParameters(
      (params as GenericObject)[variantName] as EntryPointParams,
      variantToken,
      onlyFormatMaps,
      schema![variantName] as GenericObject,
    ),
  ];
}

/**
 * Format list parameters
 *
 *
 * @param params     - Record object
 * @param token
 * @return {MichelsonMap} the corresponding Michelson Map
 */
function formatListOrSetParameter(params: EntryPointParams, token: any) {
  if (!Array.isArray(params)) {
    throw new InvalidParameter(typeof params, 'array');
  }

  let result: unknown[] = [];
  const childToken = token.createToken(token.val.args[0], 0);
  params.forEach((elt) => {
    result = [
      ...result,
      ...formatEntryPointParameters(elt as EntryPointParams, childToken, true),
    ];
  });
  return [result];
}

/**
 * Format record parameters to a list of values
 *
 *
 * @param params     - Record object
 * @param token
 * @param onlyFormatMaps
 * @param schema
 * @return {MichelsonMap} the corresponding Michelson Map
 */
function formatRecordParameter(
  params: EntryPointParams,
  token: any,
  onlyFormatMaps: boolean,
  schema?: GenericObject,
) {
  if (Array.isArray(params)) {
    throw new InvalidParameter('array', 'object');
  }

  if (onlyFormatMaps) {
    const resultObj: GenericObject = {};
    Object.keys(params).forEach((argName) => {
      const childToken = findChildTokenByAnnotation(
        token,
        argName,
        pair.PairToken,
      );
      if (!childToken) {
        throw new InvalidParameterName(argName);
      }
      resultObj[argName] = formatEntryPointParameters(
        (params as GenericObject)[`${argName}`] as EntryPointParams,
        childToken,
        onlyFormatMaps,
      )[0];
    });
    return [resultObj];
  }

  let result: unknown[] = [];
  Object.keys(schema!).forEach((argName) => {
    const childToken = findChildTokenByAnnotation(
      token,
      argName,
      pair.PairToken,
    );
    if (!params.hasOwnProperty(`${argName}`)) {
      throw new MissingParameter(argName);
    }
    result = [
      ...result,
      ...formatEntryPointParameters(
        (params as GenericObject)[`${argName}`] as EntryPointParams,
        childToken,
        onlyFormatMaps,
        schema![argName] as GenericObject,
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
 * @param onlyFormatMaps
 * @param schema
 * @return {MichelsonMap} the corresponding Michelson Map
 */
function formatMapParameter(
  mapParameter: MapObject[],
  token: any,
  onlyFormatMaps: boolean,
  schema?: GenericObject,
) {
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
      formatEntryPointParameters(
        param.key as EntryPointParams,
        keyToken,
        onlyFormatMaps,
        schema ? ((schema as any).map.value as GenericObject) : undefined,
      )[0] as any,
      formatEntryPointParameters(
        param.value as EntryPointParams,
        valueToken,
        onlyFormatMaps,
        schema ? ((schema as any).map.value as GenericObject) : undefined,
      )[0],
    );
  });

  return [result];
}

/**
 * return a child object from the root by its name (annotation)
 *
 *
 * @param token
 * @param paramName
 * @param tokenType
 */
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
