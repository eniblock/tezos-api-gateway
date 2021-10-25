import { error } from '../components/errors';

export default {
  '/contract/{contract_address}/calls': {
    get: {
      summary: 'Get the list of transactions by smart contract',
      description:
        'Get the list of transactions of the specified smart contract.\n\n' +
        "Note that the TZKT indexer will return an empty array if it doesn't find any result (instead of an error). " +
        'This can happen in any of these cases : a non existent smart contract or entrypoint name, or a smart contract without any transaction yet.\n\n' +
        "Also note that the TZKT indexer doesn't return the origination operation.",
      parameters: [
        {
          name: 'contract_address',
          in: 'path',
          required: true,
          description: 'The smart contract hash to search against',
          schema: {
            $ref: '#/components/schemas/tezos_contract_address',
          },
        },
        {
          name: 'order',
          in: 'query',
          required: false,
          description: 'Specifies how the returned transactions are ordered',
          schema: {
            $ref: '#/components/schemas/order',
          },
        },
        {
          name: 'entrypoint',
          in: 'query',
          required: false,
          description: 'Filter the transactions on an entry point name',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          description: 'The numbers of items to return',
          schema: {
            type: 'integer',
            default: 20,
            minimum: 1,
            maximum: 500,
          },
        },
        {
          name: 'offset',
          in: 'query',
          required: false,
          description:
            'The number of items to skip before starting to collect the result set',
          schema: {
            type: 'integer',
            default: 0,
            minimum: 0,
            maximum: 500,
          },
        },
      ],
      responses: {
        200: {
          description: 'The transaction list of the smart contract',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                description: 'The transaction list',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    destination: {
                      type: 'string',
                    },
                    source: {
                      type: 'string',
                    },
                    timestamp: {
                      type: 'string',
                    },
                    status: {
                      type: 'string',
                    },
                    fee: {
                      type: 'number',
                    },
                    storage_limit: {
                      type: 'number',
                    },
                    counter: {
                      type: 'number',
                    },
                    hash: {
                      type: 'string',
                    },
                    block: {
                      type: 'string',
                    },
                    type: {
                      type: 'string',
                    },
                    height: {
                      type: 'number',
                    },
                    entrypoint: {
                      type: 'string',
                    },
                    parameters: {
                      oneOf: [
                        {
                          type: 'object',
                        },
                        {
                          type: 'string',
                        },
                      ],
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
