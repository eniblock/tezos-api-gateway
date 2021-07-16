import { error } from '../components/errors';

export default {
  '/user/create': {
    post: {
      summary: 'Create user accounts',
      description:
        'Create vault keys for userId, activate the accounts on the blockchain network, and return the Tezos address, these are delegated accounts because Vault will be able to sign operations on your behalf since it genarate public/private keys and store them',
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
                      description: 'public key hash of the user account',
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
  '/user/address': {
    get: {
      summary: 'Get users  of a bunch of account addresses',
      description:
        'Return a list of user id of a bunch of account addresses and null if the address is unknown',
      parameters: [
        {
          name: 'userAddressList',
          in: 'query',
          required: true,
          schema: {
            type: 'array',
            items: {
              type: 'string',
              description: 'account addresses',
            },
          },
        },
      ],
      responses: {
        200: {
          description: 'list of the users',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  description: 'user id by address',
                  properties: {
                    account: {
                      type: 'string',
                      description: 'public key hash of the user account',
                    },
                    userId: {
                      type: 'string',
                      nullable: true,
                      description: 'account identifier',
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
  '/user/add': {
    post: {
      summary: 'Associate an user id with a public key into Vault',
      description:
        'Associate an user id with a public key into Vault, this is a self managed account because Vault will only store your public key',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['userId', 'publicKey'],
              properties: {
                userId: {
                  type: 'string',
                  description: 'User account identifier',
                },
                publicKey: {
                  $ref: '#/components/schemas/tezos_address',
                  description:
                    'The Tezos public key to associate with the user id',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'successful association of user id / public key',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    description: 'User account identifier',
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
        400: error[400],
        404: error[404],
        500: error.default,
      },
    },
  },
};
