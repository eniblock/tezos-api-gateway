import { error } from '../components/errors';

export default {
  '/test/inMemorySigner': {
    post: {
      summary:
        'Request to sign a payload or an operation with explicit private key',
      description:
        "Request to sign a forged operation or a packed object with taquito's in memory signer",
      parameters: [
        {
          name: 'prefix',
          in: 'query',
          schema: {
            type: 'boolean',
            default: true,
          },
          required: false,
          description:
            'add Tezos prefix to the payload to sign. It is mandatory when signing forged operation.',
        },
      ],
      requestBody: {
        description: 'Necessary information to sign an operation',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['privateKey', 'bytesToSign'],
              properties: {
                privateKey: {
                  type: 'string',
                  description: 'The private key used to sign to operation',
                },
                bytesToSign: {
                  type: 'string',
                  description:
                    'The hexadecimal string representation of the payload to sign',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully signed the operation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['signedOperation', 'signature'],
                properties: {
                  signedOperation: {
                    type: 'string',
                  },
                  signature: {
                    type: 'string',
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
  '/test/vaultSigner': {
    post: {
      summary:
        'Request to sign a payload or an operation with explicit private key',
      description:
        "Request to sign a forged operation or a packed object with taquito's in memory signer",
      parameters: [
        {
          name: 'prefix',
          in: 'query',
          schema: {
            type: 'boolean',
            default: true,
          },
          required: false,
          description:
            'add Tezos prefix to the payload to sign. It is mandatory when signing forged operation.',
        },
      ],
      requestBody: {
        description: 'Necessary information to sign an operation',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['secureKeyName', 'bytesToSign'],
              properties: {
                secureKeyName: {
                  type: 'string',
                  description:
                    'The key name which contains public key and perform action sign',
                },
                bytesToSign: {
                  type: 'string',
                  description:
                    'The hexadecimal string representation of the payload to sign',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully signed the operation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['signedOperation', 'signature'],
                properties: {
                  signedOperation: {
                    type: 'string',
                  },
                  signature: {
                    type: 'string',
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
  '/test/packData': {
    post: {
      summary: 'Request to serialize a michelson object',
      description:
        'Request to serialize a michelson object by calling the packData endpoint of the rpc gateway',
      requestBody: {
        description: 'Necessary information to pack a michelson data',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['data', 'type'],
              properties: {
                data: {
                  oneOf: [{ type: 'object' }, { type: 'array' }],
                  description: 'TODO',
                },
                type: {
                  type: 'object',
                  description: 'TODO',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'hex string representing packed data',
          content: {
            'application/json': {
              schema: {
                type: 'string',
              },
            },
          },
        },
        400: error[400],
        500: error.default,
      },
    },
  },
};
