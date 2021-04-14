import { error } from '../components/errors';

export default {
  '/tezos_node/storage/{contract_address}': {
    post: {
      summary: 'Get information of a contract storage',
      description: 'Get information of a contract storage',
      parameters: [
        {
          name: 'contract_address',
          in: 'path',
          required: true,
          schema: {
            $ref: '#/components/schemas/tezos_address',
          },
        },
      ],
      requestBody: {
        description:
          'Addition information to get partial of the contract storage',
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                dataFields: {
                  type: 'array',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'the details of the contract storage',
          content: {
            'application/json': {
              schema: {
                type: 'object',
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
