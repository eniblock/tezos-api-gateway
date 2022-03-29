import { error } from '../components/errors';

export default {
  '/forge/jobs': {
    post: {
      summary: 'Request to forge an operation',
      description: 'Request to forge an operation',
      parameters: [
        {
          name: 'cache',
          in: 'query',
          schema: {
            type: 'boolean',
            default: true,
          },
          required: false,
          description: 'Uses the cache to retrieve the contract information',
        },
        {
          name: 'reveal',
          in: 'query',
          schema: {
            type: 'boolean',
            default: false,
          },
          required: false,
          description:
            'Adds a reveal operation if the tezos address is not revealed. Note that an error will be returned if the total number of operations (reveal + transactions) exceeds 5.',
        },
      ],
      requestBody: {
        description: 'Necessary information to forge an operation',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['transactions', 'sourceAddress'],
              properties: {
                transactions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['contractAddress', 'entryPoint'],
                    properties: {
                      contractAddress: {
                        $ref: '#/components/schemas/tezos_contract_address',
                      },
                      entryPoint: {
                        type: 'string',
                        description: "The entry point's name of the contract",
                      },
                      entryPointParams: {
                        oneOf: [
                          { nullable: true, type: 'object' },
                          { type: 'string' },
                          { type: 'array' },
                          { type: 'number' },
                          { type: 'boolean' },
                        ],
                      },
                      amount: {
                        $ref: '#/components/schemas/amount',
                      },
                    },
                  },
                },
                callerId: {
                  $ref: '#/components/schemas/callerId',
                },
                sourceAddress: {
                  $ref: '#/components/schemas/tezos_address',
                },
                publicKey: {
                  $ref: '#/components/schemas/tezos_public_key',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'successful forged operation and created a job',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/job',
              },
            },
          },
        },
        400: error[400],
        500: error.default,
      },
    },
  },
  '/forge/reveal': {
    post: {
      summary: 'Reveal an address',
      description:
        'Returns the reveal operation for a given address and public key, to be used in a self-custody context',
      requestBody: {
        description: 'Necessary information to forge a reveal operation',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['address', 'publicKey'],
              properties: {
                address: {
                  $ref: '#/components/schemas/tezos_address',
                },
                publicKey: {
                  $ref: '#/components/schemas/tezos_public_key',
                },
                callerId: {
                  $ref: '#/components/schemas/callerId',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description:
            'Successfully forged the reveal operation and created a job',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/job',
              },
            },
          },
        },
        409: {
          description: 'Conflict error, address is already revealed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Address *** is already revealed',
                  },
                  status: {
                    type: 'number',
                    example: 409,
                  },
                },
              },
            },
          },
        },
        400: error[400],
        404: error[404],
        500: error.default,
      },
    },
  },
  '/inject/jobs': {
    patch: {
      summary: 'Request to patch a job',
      description:
        'Request to patch a job with signed transaction and inject the transaction to Tezos',
      requestBody: {
        description: 'Necessary information to patch the job',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['jobId', 'signedTransaction', 'signature'],
              properties: {
                jobId: {
                  type: 'number',
                  description: 'The job id that is going to be patched',
                },
                signedTransaction: {
                  type: 'string',
                  description: 'the signed transaction',
                },
                signature: {
                  type: 'string',
                  description: 'the signature used to sign',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description:
            'successfully injected operation and return the updated job',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/job',
              },
            },
          },
        },
        400: error[400],
        500: error.default,
      },
    },
  },
  '/async/inject/jobs': {
    patch: {
      summary: 'Request to patch a job asynchronously',
      description:
        'Request to patch a job with signed transaction and inject the transaction to Tezos asynchronously',
      requestBody: {
        description: 'Necessary information to patch the job',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['jobId', 'signedTransaction', 'signature'],
              properties: {
                jobId: {
                  type: 'number',
                  description: 'The job id that is going to be patched',
                },
                signedTransaction: {
                  type: 'string',
                  description: 'the signed transaction',
                },
                signature: {
                  type: 'string',
                  description: 'the signature used to sign',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description:
            'successfully injected operation and return the updated job',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/job',
              },
            },
          },
        },
        400: error[400],
        500: error.default,
      },
    },
  },
  '/send/jobs': {
    post: {
      summary: 'Request to send a list of transactions to Tezos',
      description: 'Request to send a list of transactions to Tezos',
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
        description: 'Necessary information to send transactions',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['transactions', 'secureKeyName'],
              properties: {
                transactions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['contractAddress', 'entryPoint'],
                    properties: {
                      contractAddress: {
                        $ref: '#/components/schemas/tezos_contract_address',
                      },
                      entryPoint: {
                        type: 'string',
                        description: "The entry point's name of the contract",
                      },
                      entryPointParams: {
                        oneOf: [
                          { nullable: true, type: 'object' },
                          { type: 'string' },
                          { type: 'array' },
                          { type: 'number' },
                          { type: 'boolean' },
                        ],
                      },
                      amount: {
                        $ref: '#/components/schemas/amount',
                      },
                    },
                  },
                },
                callerId: {
                  $ref: '#/components/schemas/callerId',
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
      responses: {
        201: {
          description:
            'successful created a job and send transactions to tezos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/job',
              },
            },
          },
        },
        400: error[400],
        500: error.default,
      },
    },
  },
  '/async/send/jobs': {
    post: {
      summary: 'Request to send a list of transactions to Tezos asynchronously',
      description:
        'Request to send a list of transactions to Tezos asynchronously',
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
        description: 'Necessary information to send transactions',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['transactions', 'secureKeyName'],
              properties: {
                transactions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['contractAddress', 'entryPoint'],
                    properties: {
                      contractAddress: {
                        $ref: '#/components/schemas/tezos_contract_address',
                      },
                      entryPoint: {
                        type: 'string',
                        description: "The entry point's name of the contract",
                      },
                      entryPointParams: {
                        oneOf: [
                          { nullable: true, type: 'object' },
                          { type: 'string' },
                          { type: 'array' },
                          { type: 'number' },
                          { type: 'boolean' },
                        ],
                      },
                      amount: {
                        $ref: '#/components/schemas/amount',
                      },
                    },
                  },
                },
                callerId: {
                  $ref: '#/components/schemas/callerId',
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
      responses: {
        201: {
          description:
            'successful created a job and send transactions to tezos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/job',
              },
            },
          },
        },
        400: error[400],
        500: error.default,
      },
    },
  },
  '/job/{id}': {
    get: {
      summary: 'Get the Job by its ID',
      description:
        'Retrieving job information whose ID is passed as a parameter',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'integer',
            minimum: 1,
          },
        },
      ],
      responses: {
        200: {
          description: 'successful getting the job informations by its ID',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/job',
              },
            },
          },
        },
        400: error[400],
        404: error[404],
        500: error.default,
      },
    },
  },
};
