export const error = {
  400: {
    description: 'Validation error',
    content: {
      'application/json': {
        example: {
          status_code: 400,
          message: 'Validation error',
        },
        schema: {
          type: 'object',
          properties: {
            status_code: {
              type: 'integer',
              description: 'status code',
              enum: [400],
            },
            message: {
              type: 'string',
              description: 'error detail',
            },
          },
        },
      },
    },
  },
  404: {
    description: 'Not Found Error',
    content: {
      'application/json': {
        example: {
          status: 404,
          message: 'Not Found',
        },
        schema: {
          type: 'object',
          properties: {
            status_code: {
              type: 'integer',
              description: 'status code',
              enum: [404],
            },
            message: {
              type: 'string',
              description: 'error detail',
            },
          },
        },
      },
    },
  },
  default: {
    description: 'Operation error',
    content: {
      'application/json': {
        example: {
          status: 500,
          message: 'Internal Server Error',
        },
        schema: {
          $ref: '#/components/schemas/error',
        },
      },
    },
  },
};
