import { error } from '../components/errors';

export default {
  '/utils/pack-data': {
    post: {
      summary: 'Request to serialize a michelson object',
      description:
        'Request to serialize a michelson object by calling the packData endpoint of the rpc gateway',
      requestBody: {
        description: 'Necessary information to pack michelson data',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['data', 'type'],
              properties: {
                data: {
                  oneOf: [
                    { type: 'object' },
                    { type: 'array' },
                    { type: 'string' },
                    { type: 'number' },
                    { type: 'boolean' },
                  ],
                  description: 'data to serialize, JSON formatted',
                },
                type: {
                  type: 'object',
                  description: 'Michelson object type (JSON)',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully packed data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                required: ['packedData'],
                properties: {
                  packedData: {
                    description: 'hex string of packed data',
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
