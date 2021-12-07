import {
  FORGE_RESPONSE_SCHEMA,
  generatePathObject,
} from '../../../../src/lib/generate-path-object';
import { TezosService } from '../../../../src/services/tezos';

import { logger } from '../../../__fixtures__/services/logger';
import { tezosNodeUrl } from '../../../__fixtures__/config';
import {
  FA2Contract,
  flexibleTokenContract,
} from '../../../__fixtures__/smart-contract';

describe('[lib/generate-path-object] Index', () => {
  const tezosService = new TezosService(tezosNodeUrl);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#generatePathObject', () => {
    it('should correctly return the path object base on the FA2 smart contract schema', async () => {
      await expect(
        generatePathObject(logger, tezosService, FA2Contract),
      ).resolves.toEqual({
        '/forge/balance_of': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['requests', 'callback'],
                        properties: {
                          requests: {
                            $ref: '#/components/schemas/flexible_array',
                          },
                          callback: {
                            type: 'object',
                          },
                        },
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/mint': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['address', 'amount', 'metadata', 'token_id'],
                        properties: {
                          address: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          amount: {
                            type: 'number',
                          },
                          metadata: {
                            type: 'object',
                            additionalProperties: false,
                            required: ['key', 'value'],
                            properties: {
                              key: {
                                type: 'string',
                              },
                              value: {
                                type: 'string',
                                pattern: '^[0-9a-zA-Z]$',
                                description: 'A bytes string',
                                example: '54686520546f6b656e204f6e65',
                              },
                            },
                          },
                          token_id: {
                            type: 'number',
                          },
                        },
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/set_administrator': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/set_metadata': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['k', 'v'],
                        properties: {
                          k: {
                            type: 'string',
                          },
                          v: {
                            type: 'string',
                            pattern: '^[0-9a-zA-Z]$',
                            description: 'A bytes string',
                            example: '54686520546f6b656e204f6e65',
                          },
                        },
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/set_pause': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'boolean',
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/transfer': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        $ref: '#/components/schemas/flexible_array',
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/update_operators': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        $ref: '#/components/schemas/flexible_array',
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/balance_of': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['requests', 'callback'],
                        properties: {
                          requests: {
                            $ref: '#/components/schemas/flexible_array',
                          },
                          callback: {
                            type: 'object',
                          },
                        },
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/balance_of': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['requests', 'callback'],
                        properties: {
                          requests: {
                            $ref: '#/components/schemas/flexible_array',
                          },
                          callback: {
                            type: 'object',
                          },
                        },
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/mint': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['address', 'amount', 'metadata', 'token_id'],
                        properties: {
                          address: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          amount: {
                            type: 'number',
                          },
                          metadata: {
                            type: 'object',
                            additionalProperties: false,
                            required: ['key', 'value'],
                            properties: {
                              key: {
                                type: 'string',
                              },
                              value: {
                                type: 'string',
                                pattern: '^[0-9a-zA-Z]$',
                                description: 'A bytes string',
                                example: '54686520546f6b656e204f6e65',
                              },
                            },
                          },
                          token_id: {
                            type: 'number',
                          },
                        },
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/mint': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['address', 'amount', 'metadata', 'token_id'],
                        properties: {
                          address: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          amount: {
                            type: 'number',
                          },
                          metadata: {
                            type: 'object',
                            additionalProperties: false,
                            required: ['key', 'value'],
                            properties: {
                              key: {
                                type: 'string',
                              },
                              value: {
                                type: 'string',
                                pattern: '^[0-9a-zA-Z]$',
                                description: 'A bytes string',
                                example: '54686520546f6b656e204f6e65',
                              },
                            },
                          },
                          token_id: {
                            type: 'number',
                          },
                        },
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/set_administrator': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/set_administrator': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/set_metadata': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['k', 'v'],
                        properties: {
                          k: {
                            type: 'string',
                          },
                          v: {
                            type: 'string',
                            pattern: '^[0-9a-zA-Z]$',
                            description: 'A bytes string',
                            example: '54686520546f6b656e204f6e65',
                          },
                        },
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/set_metadata': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['k', 'v'],
                        properties: {
                          k: {
                            type: 'string',
                          },
                          v: {
                            type: 'string',
                            pattern: '^[0-9a-zA-Z]$',
                            description: 'A bytes string',
                            example: '54686520546f6b656e204f6e65',
                          },
                        },
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/set_pause': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'boolean',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/set_pause': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'boolean',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/transfer': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        $ref: '#/components/schemas/flexible_array',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/transfer': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        $ref: '#/components/schemas/flexible_array',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/update_operators': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        $ref: '#/components/schemas/flexible_array',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/update_operators': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        $ref: '#/components/schemas/flexible_array',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
      });
    });

    it('should correctly return the path object base on the Flexible Token smart contract schema', async () => {
      await expect(
        generatePathObject(logger, tezosService, flexibleTokenContract),
      ).resolves.toEqual({
        '/forge/acceptOwnership': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress'],
                    properties: {
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/approve': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['spender', 'tokens'],
                        properties: {
                          spender: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          tokens: {
                            type: 'number',
                          },
                        },
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/lock': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress'],
                    properties: {
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/setName': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'string',
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/setSymbol': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'string',
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/transfer': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['destination', 'tokens'],
                        properties: {
                          destination: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          tokens: {
                            type: 'number',
                          },
                        },
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/transferFrom': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['_from', '_to', 'tokens'],
                        properties: {
                          _from: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          _to: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          tokens: {
                            type: 'number',
                          },
                        },
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/transferOwnerShip': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress', 'parameters'],
                    properties: {
                      parameters: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/forge/unlock': {
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
              description: 'Necessary information to forge a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['sourceAddress'],
                    properties: {
                      sourceAddress: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/acceptOwnership': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName'],
                    properties: {
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/acceptOwnership': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName'],
                    properties: {
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/approve': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['spender', 'tokens'],
                        properties: {
                          spender: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          tokens: {
                            type: 'number',
                          },
                        },
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/approve': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['spender', 'tokens'],
                        properties: {
                          spender: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          tokens: {
                            type: 'number',
                          },
                        },
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/lock': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName'],
                    properties: {
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/lock': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName'],
                    properties: {
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/setName': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'string',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/setName': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'string',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/setSymbol': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'string',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/setSymbol': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'string',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/transfer': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['destination', 'tokens'],
                        properties: {
                          destination: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          tokens: {
                            type: 'number',
                          },
                        },
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/transfer': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['destination', 'tokens'],
                        properties: {
                          destination: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          tokens: {
                            type: 'number',
                          },
                        },
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/transferFrom': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['_from', '_to', 'tokens'],
                        properties: {
                          _from: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          _to: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          tokens: {
                            type: 'number',
                          },
                        },
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/transferFrom': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['_from', '_to', 'tokens'],
                        properties: {
                          _from: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          _to: {
                            $ref: '#/components/schemas/tezos_address',
                          },
                          tokens: {
                            type: 'number',
                          },
                        },
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/transferOwnerShip': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/transferOwnerShip': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName', 'parameters'],
                    properties: {
                      parameters: {
                        $ref: '#/components/schemas/tezos_address',
                      },
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/send/unlock': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName'],
                    properties: {
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
        '/async/send/unlock': {
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
              description: 'Necessary information to send a transaction',
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['secureKeyName'],
                    properties: {
                      secureKeyName: {
                        type: 'string',
                        description:
                          'The key name which contains public key and perform action sign',
                      },
                    },
                  },
                },
              },
            },
            responses: FORGE_RESPONSE_SCHEMA,
          },
        },
      });
    });
  });
});
