import { error } from '../components/errors';

export default {
  '/user/create': {
    post: {
      summary: 'Create user accounts',
      description: 'Create user accounts',
      requestBody: {
        description:
          'Addition information to get partial of the contract storage',
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                userIdList:{
                  type: 'array',
                  items:{
                    type: 'string',
                    description: 'user accounts identifier'
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
      responses: {
        201: {
          description: 'the details of the created account',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  description: 'created accounts',
                  properties: {
                    userId: {
                      type: 'string',
                      description: 'account identifier'
                    },
                    account: {
                      type: 'string',
                      description: 'public key hash of the created account'
                    },
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
  '/user': {
    get: {
      summary: 'Get entrypoints schema of a contract',
      description: 'Get entrypoints schema of a contract',
      parameters: [
        {
          name: 'userIdList',
          in: 'query',
          required: true,
          schema: {
            type: 'array',
            items: {
              type: 'string',
              description: "account identifiers",
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'the contract entrypoint(s) schema',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  description: 'created accounts',
                  properties: {
                    userId: {
                      type: 'string',
                      description: 'account identifier'
                    },
                    account: {
                      type: 'string',
                      description: 'public key hash of the created account'
                    },
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
