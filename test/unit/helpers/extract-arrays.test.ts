import { extractForgeAndSendTransactionsPaths } from '../../../src/helpers/extract-arrays';
import { FORGE_RESPONSE_SCHEMA } from '../../../src/lib/generate-path-object';

describe('[helpers/extract-arrays]', () => {
  describe('#extractForgeAndSendTransactionsPaths', () => {
    it('should correctly return the forge paths and send paths', () => {
      expect(
        extractForgeAndSendTransactionsPaths({
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
        }),
      ).toEqual({
        forgePaths: ['/forge/acceptOwnership', '/forge/approve', '/forge/lock'],
        sendPaths: [
          '/send/transferFrom',
          '/send/transferOwnerShip',
          '/send/unlock',
        ],
        asyncSendPaths: [
          '/async/send/transferFrom',
          '/async/send/transferOwnerShip',
          '/async/send/unlock',
        ],
      });
    });
  });
});
