import { error } from '../components/errors';

export default {
  '/user/create': {
    post: {
      summary: 'Create user accounts',
      description:
        'Create vault keys for by user Id, activate the accounts on the blockchain network, and return the Tezos address',
      requestBody: {
        description:
          'list of the identifiers of the users to be created, and the master key id to activate them',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['userIdList', 'secureKeyName'],
              properties: {
                userIdList: {
                  type: 'array',
                  items: {
                    type: 'string',
                    description: 'user accounts identifier',
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
                  description: 'user account by id',
                  properties: {
                    userId: {
                      type: 'string',
                      description: 'account identifier',
                    },
                    account: {
                      type: 'string',
                      description: 'public key hash of the created account',
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
      summary: 'Get account addresses of a bunch of users',
      description:
        'Return a list of Tezos account addresses of a bunch of users and null if the user is unknown',
      parameters: [
        {
          name: 'userIdList',
          in: 'query',
          required: true,
          schema: {
            type: 'array',
            items: {
              type: 'string',
              description: 'account identifiers',
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'list of the user account addresses',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  description: 'user account by id',
                  properties: {
                    userId: {
                      type: 'string',
                      description: 'account identifier',
                    },
                    account: {
                      type: 'string',
                      nullable: true,
                      description: 'public key hash of the created account',
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
