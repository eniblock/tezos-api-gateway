import _ from 'lodash';
import Logger from 'bunyan';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';

import { TezosService } from '../../services/tezos';
import { getContractParameterSchema } from '../smart-contracts/get-contract-schema';
import { error } from '../../config/openapi/spec/components/errors';
import { GenericObject } from '../../const/interfaces/forge-operation-params';
import { TezosDataType } from '../../const/tezos-data-type';

export const FORGE_RESPONSE_SCHEMA: OpenAPIV3.ResponsesObject = {
  201: {
    description: 'successful forged operation and created a job',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'The id of the new job',
            },
            status: {
              type: 'string',
              description:
                'the status of the operation corresponding to the job',
              example: 'forged',
            },
            forged_operation: {
              type: 'string',
              nullable: true,
              description: 'the raw forged operation corresponding to the job',
            },
            operation_hash: {
              type: 'string',
              nullable: true,
              description: 'the operation hash corresponding to the job',
            },
            operation_kind: {
              type: 'string',
              nullable: false,
              description: 'the operation type',
              enum: ['transaction', 'reveal'],
            },
          },
        },
      },
    },
  },
  400: error[400] as OpenAPIV3.ResponseObject,
  500: error.default,
};

export enum ACTION {
  FORGE = 'forge',
  SEND = 'send',
}

interface TezosMapSchema {
  map: {
    key: GenericObject | TezosDataType;
    value: GenericObject | TezosDataType;
  };
}

interface TezosListSchema {
  list: GenericObject;
}

interface OpenApiProperties {
  [name: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
}

/**
 * Generate the path object base on a contract parameter schema
 *
 * @param {logger} logger          - the logger
 * @param {object} tezosService    - the service interacting with Tezos
 * @param {string} contractAddress - the smart contract address
 */
export async function generatePathObject(
  logger: Logger,
  tezosService: TezosService,
  contractAddress: string,
): Promise<OpenAPIV3.PathsObject> {
  logger.info(
    { contractAddress },
    '[lib/generate-path-schema/#generatePathObject] Get the contract parameter schema',
  );

  const parameterSchema = await getContractParameterSchema(
    tezosService,
    contractAddress,
  );

  logger.info(
    { parameterSchema },
    '[lib/generate-path-schema/#generatePathObject] Get the contract parameter schema',
  );

  const path: OpenAPIV3.PathsObject = {};

  Object.entries(parameterSchema).forEach(([key, value]) => {
    path[`/${ACTION.FORGE}/${key}`] = generatePathItemSchema(
      value,
      ACTION.FORGE,
    );
    path[`/${ACTION.SEND}/${key}`] = generatePathItemSchema(value, ACTION.SEND);
    path[`/async/${ACTION.SEND}/${key}`] = generatePathItemSchema(
      value,
      ACTION.SEND,
    );
  });

  return path;
}

/**
 * Generate the OpenAPI v3 path item object
 * base on smart contract entry point schema
 *
 * @param {object | string} smartContractEntryPointSchema - the smart contract entry point schema
 * @param {string} action                                 - the action that clients will do with the entry point (forge or send transaction)
 *
 * @return {object} the path item object (OpenAPI v3 format)
 */
function generatePathItemSchema(
  smartContractEntryPointSchema: unknown,
  action: ACTION,
): OpenAPIV3.PathItemObject {
  const required =
    action === ACTION.FORGE ? ['sourceAddress'] : ['secureKeyName'];

  const properties: OpenApiProperties =
    action === ACTION.FORGE
      ? {
          sourceAddress: {
            $ref: '#/components/schemas/tezos_address',
          },
        }
      : {
          secureKeyName: {
            type: 'string',
            description:
              'The key name which contains public key and perform action sign',
          },
        };

  if (smartContractEntryPointSchema !== TezosDataType.UNIT) {
    properties.parameters = generateSchemaObject(smartContractEntryPointSchema);
    required.push('parameters');
  }

  return {
    post: {
      parameters: [
        {
          name: 'cache',
          in: 'query',
          schema: {
            type: 'boolean',
            default: true,
          },
          required: false,
          description:
            'Specifies if the cache should be used to retrieve the contract',
        },
      ],
      requestBody: {
        description: `Necessary information to ${action} a transaction`,
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required,
              properties,
            },
          },
        },
      },
      responses: FORGE_RESPONSE_SCHEMA,
    },
  };
}

/**
 * Generate OpenAPI schema object base on the entry point schema
 *
 * @param {object | string} smartContractEntryPointSchema - the smart contract entry point schema
 *
 * @return {object} the schema object
 */
export function generateSchemaObject(
  smartContractEntryPointSchema: unknown,
): OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject {
  if (typeof smartContractEntryPointSchema === 'object') {
    return handleObjectCase(smartContractEntryPointSchema as GenericObject);
  }

  switch (smartContractEntryPointSchema) {
    case TezosDataType.ADDRESS:
      return {
        $ref: '#/components/schemas/tezos_address',
      };
    case TezosDataType.BYTES:
      return {
        type: 'string',
        pattern: '^[0-9a-zA-Z]$',
        description: 'A bytes string',
        example: '54686520546f6b656e204f6e65',
      };
    case TezosDataType.BOOLEAN:
      return {
        type: 'boolean',
      };
    case TezosDataType.INTEGER:
    case TezosDataType.NATURAL:
      return {
        type: 'number',
      };
    case TezosDataType.LIST:
      return {
        $ref: '#/components/schemas/flexible_array',
      };
    case TezosDataType.STRING:
      return {
        type: 'string',
      };
    default:
      return {
        type: 'object',
      };
  }
}

/**
 * Return the correct OpenAPI schema object
 *
 * @param {object} object   - the smart contract schema as object
 *
 * @return {object} the schema object
 */
function handleObjectCase(object: GenericObject): OpenAPIV3.SchemaObject {
  if (TezosDataType.MAP in object) {
    return handleMapCase(object as unknown as TezosMapSchema);
  }

  if (TezosDataType.LIST in object) {
    return handleListCase((object as unknown) as TezosListSchema);
  }

  const properties = _.fromPairs(
    Object.entries(object).map(([key, value]) => {
      return [key, generateSchemaObject(value)];
    }),
  );

  return {
    type: 'object',
    additionalProperties: false,
    required: Object.keys(object),
    properties,
  };
}

/**
 * Return the OpenAPI schema object when the smart contract schema is a list
 *
 * @param {object} listSchema  - the smart contract schema
 *
 * @return {object} the schema object
 */
function handleListCase(listSchema: TezosListSchema): OpenAPIV3.SchemaObject {
  return {
    type: 'array',
    items: generateSchemaObject(listSchema.list),
  };
}

/**
 * Return the OpenAPI schema object when the smart contract schema is map
 *
 * @param {object} mapSchema  - the smart contract schema
 *
 * @return {object} the schema object
 */
function handleMapCase(mapSchema: TezosMapSchema): OpenAPIV3.SchemaObject {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['key', 'value'],
    properties: {
      key: generateSchemaObject(mapSchema.map.key),
      value: generateSchemaObject(mapSchema.map.value),
    },
  };
}
