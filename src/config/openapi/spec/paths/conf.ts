import { error } from '../components/errors';

export default {
  '/conf': {
    get: {
      summary: 'Get the configuration',
      description: 'Get the configuration currently used by TAG',
      responses: {
        200: {
          description: 'The configuration used by TAG',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'The configuration object',
                properties: {
                  tezosNodesURLs: {
                    type: 'array',
                    description: 'The tezos nodes URL that can be used by TAG',
                    items: {
                      type: 'string',
                    },
                  },
                  tezosIndexers: {
                    type: 'array',
                    description:
                      'The tezos indexers URL and name that can be used by TAG',
                    items: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                        },
                        url: {
                          type: 'string',
                        },
                      },
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
