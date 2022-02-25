import { error } from '../components/errors';

export default {
  '/utils/pack-data': {
    post: {
      summary: 'Request to serialize a michelson object',
      description:
        'Request to serialize a michelson object by calling the packData endpoint of the rpc gateway',
      requestBody: {
        description: 'Necessary information to pack michelson data',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['data', 'type'],
              properties: {
                data: {
                  oneOf: [
                    { type: 'object' },
                    { type: 'array' },
                    { type: 'string' },
                    { type: 'number' },
                    { type: 'boolean' },
                  ],
                  description: 'data to serialize, JSON formatted',
                },
                type: {
                  type: 'object',
                  description: 'Michelson object type (JSON)',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully packed data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['packedData'],
                properties: {
                  packedData: {
                    description: 'hex string of packed data',
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
  '/utils/check-signature': {
    post: {
      summary: 'Request to check the correctness of a Tezos signatures',
      description:
        "Request to verify a cryptographic Ed25519 Tezos signature given the signed hexadecimal data, the signer's public key, and the signature itself",
      parameters: [
        {
          name: 'operationPrefix',
          in: 'query',
          schema: {
            type: 'boolean',
            default: false,
          },
          required: false,
          description:
            'add the Tezos operation prefix to the payload to sign. It is mandatory when signing forged operations.',
        },
      ],
      requestBody: {
        description: 'Necessary information to check a signature validity',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['signature', 'publicKey', 'hexData'],
              properties: {
                publicKey: {
                  $ref: '#/components/schemas/tezos_public_key',
                },
                hexData: {
                  $ref: '#/components/schemas/hex_string',
                },
                signature: {
                  $ref: '#/components/schemas/tezos_signature',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Signature check result',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['result'],
                properties: {
                  result: {
                    type: 'boolean',
                    description:
                      'Return true if the signature is successfully verified',
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
};
