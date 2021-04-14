export const dataFieldsSchema = {
  definitions: {
    dataFields: {
      type: 'array',
      items: {
        oneOf: [
          {
            type: 'string',
            description: 'the path get to the requested data',
          },
          {
            type: 'object',
            patternProperties: {
              '[\\w_-]': {
                type: 'array',
                items: {
                  $ref: '#/definitions/map_object_request_data_field',
                },
              },
            },
          },
        ],
      },
    },
    map_object_request_data_field: {
      type: 'object',
      required: ['key'],
      additionalProperties: false,
      properties: {
        key: {
          oneOf: [
            {
              type: 'string',
              description: 'the key to get the data in map',
            },
            {
              type: 'object',
              description: 'the key to get the data in map',
            },
            {
              type: 'boolean',
              description: 'the key to get the data in map',
            },
            {
              type: 'number',
              description: 'the key to get the data in map',
            },
          ],
        },
        dataFields: {
          $ref: '#/definitions/dataFields',
        },
      },
    },
  },
  $ref: '#/definitions/dataFields',
};
