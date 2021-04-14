import { error } from '../components/errors';

export default {
  '/entrypoints/{contract_address}': {
    get: {
      summary: 'Get entrypoints schema of a contract',
      description: 'Get entrypoints schema of a contract',
      parameters: [
        {
          name: 'contract_address',
          in: 'path',
          required: true,
          schema: {
            $ref: '#/components/schemas/tezos_address',
          },
        },
        {
          name: 'entryPoints',
          in: 'query',
          required: false,
          schema: {
            type: 'array',
            items: {
              type: 'string',
              description: "The entry point's name",
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
                type: 'object',
                properties: {
                  contractEntryPointsList: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'The list of the contract entry points',
                  },
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        entryPoint: {
                          type: 'string',
                          description: 'the entry point name',
                        },
                        schema: {
                          description:
                            'the json schema of the entry point parameters',
                        },
                        michelson: {
                          type: 'object',
                          description:
                            'the michelson representation of the entry point parameters. ' +
                            'The goal of the field is to complete the details of the schema field.' +
                            'Ex: in case of a list of records, schema will return just "list"',
                        },
                      },
                    },
                    description: 'The list of parameters schema by entry point',
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
