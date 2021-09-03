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
          description:
            'Specifies if the cache should be used to retrieve the contract',
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
                        $ref: '#/components/schemas/tezos_address',
                      },
                      entryPoint: {
                        type: 'string',
                        description: "The entry point's name of the contract",
                      },
                      entryPointParams: {
                        oneOf: [
                          { type: 'object' },
                          { type: 'string' },
                          { type: 'array' },
                          { type: 'number' },
                        ],
                      },
                    },
                  },
                },
                callerId: {
                  type: 'string',
                  nullable: true,
                  description: 'The identifier of the calling application',
                },
                sourceAddress: {
                  $ref: '#/components/schemas/tezos_address',
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
                  raw_transaction: {
                    type: 'string',
                    nullable: true,
                    description: 'the raw transaction corresponding to the job',
                  },
                  operation_hash: {
                    type: 'string',
                    nullable: true,
                    description: 'the operation hash corresponding to the job',
                  },
                },
              },
            },
          },
        },
        400: error[400],
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
                  raw_transaction: {
                    type: 'string',
                    nullable: true,
                    description: 'the raw transaction corresponding to the job',
                  },
                  operation_hash: {
                    type: 'string',
                    nullable: true,
                    description: 'the operation hash corresponding to the job',
                  },
                },
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
                        $ref: '#/components/schemas/tezos_address',
                      },
                      entryPoint: {
                        type: 'string',
                        description: "The entry point's name of the contract",
                      },
                      entryPointParams: {
                        oneOf: [
                          { type: 'object' },
                          { type: 'string' },
                          { type: 'array' },
                          { type: 'number' },
                        ],
                      },
                    },
                  },
                },
                callerId: {
                  type: 'string',
                  nullable: true,
                  description: 'The identifier of the calling application',
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
                  raw_transaction: {
                    type: 'string',
                    nullable: true,
                    description: 'the raw transaction corresponding to the job',
                  },
                  operation_hash: {
                    type: 'string',
                    nullable: true,
                    description: 'the operation hash corresponding to the job',
                  },
                },
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
                  raw_transaction: {
                    type: 'string',
                    nullable: true,
                    description: 'the raw transaction corresponding to the job',
                  },
                  operation_hash: {
                    type: 'string',
                    nullable: true,
                    description: 'the operation hash corresponding to the job',
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
};
