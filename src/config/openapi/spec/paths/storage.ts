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
  '/tezos_node/contract/deploy': {
    post: {
      summary: 'Request to deploy a smart contract to Tezos',
      description: 'Request to send the code to Tezos',
      requestBody: {
        description: 'Necessary information to contract',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['smartContractCode', 'secureKeyName'],
              properties: {
                secureKeyName: {
                  type: 'string',
                  description:
                    'The key name which contains public key and perform action sign',
                },
                smartContractCode: {
                  type: 'string',
                  description:
                    'The code of smart contract to be upload in Base64, a sp.add_compilation_target should be added in the contract otherwise compilation will fail',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'successful created a job',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  operation_hash: {
                    type: 'string',
                    description: 'the operation hash corresponding to the job',
                  },
                  contract_address: {
                    type: 'string',
                    description: 'the address of the contract deployed',
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
