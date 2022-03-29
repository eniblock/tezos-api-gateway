import { error } from '../components/errors';

export default {
  '/test/inMemorySigner': {
    post: {
      summary: 'Sign data with secret key',
      description:
        "Request to sign a forged operation or a packed object with taquito's in memory signer",
      parameters: [
        {
          name: 'operationPrefix',
          in: 'query',
          schema: {
            type: 'boolean',
            default: true,
          },
          required: false,
          description:
            'add the operation Tezos prefix to the payload to sign. It is mandatory when signing forged operation.',
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
              required: ['privateKey', 'forgedOperation'],
              properties: {
                privateKey: {
                  type: 'string',
                  description: 'The private key used to sign to operation',
                },
                forgedOperation: {
                  $ref: '#/components/schemas/hex_string',
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
        400: error[400],
        500: error.default,
      },
    },
  },
};
