import { error } from '../components/errors';

export default {
  '/test/inMemorySigner': {
    post: {
      summary: 'Request to sign an operation',
      description:
        "Request to sign a forged operation with taquito's in memory signer",
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
                  type: 'string',
                  description: 'The forged operation to sign',
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
};
