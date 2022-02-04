import {
  flexibleTokenContract,
  testAccount,
} from '../../../../../test/__fixtures__/smart-contract';
import { error } from './errors';

const components = {
  securitySchemes: {},
  schemas: {
    original_url: {
      type: 'string',
      description: 'The original url of the request',
      example: '/api/jobs',
    },
    error: {
      type: 'object',
      required: ['status', 'message'],
      properties: {
        status: {
          type: 'number',
          example: 400,
          description: 'Error code status',
        },
        message: {
          type: 'string',
          example: 'Bad Request',
          description: 'Error message',
        },
      },
    },
    flexible_array: {
      type: 'array',
      items: {
        oneOf: [
          {
            type: 'object',
          },
          {
            type: 'string',
          },
          {
            type: 'array',
          },
          {
            type: 'number',
          },
          {
            type: 'boolean',
          },
        ],
      },
    },
    tezos_address: {
      type: 'string',
      pattern: '^tz+[0-9a-zA-Z]{34}$',
      description: 'A tezos address account (public key hash)',
      example: testAccount,
    },
    tezos_public_key: {
      type: 'string',
      pattern: '^edpk+[0-9a-zA-Z]{50}$',
      description: 'An tezos public key',
      example: 'edpkuJpbmRrKVbXHWmJAU5v9YKiA1PCiy1xo1UyAKeUjpSvkXM5wfe',
    },
    tezos_contract_address: {
      type: 'string',
      pattern: '^KT+[0-9a-zA-Z]{34}$',
      description: 'A tezos smart contract address',
      example: flexibleTokenContract,
    },
    amount: {
      type: 'integer',
      default: 0,
      minimum: 0,
      description:
        'Amount of XTZ tokens transferred to the contract along with the transaction, in mutez (1 XTZ = 10⁶ mutez)',
    },
    indexer: {
      type: 'string',
      pattern: '^\\btzstats\\b|\\btzkt\\b$',
      description: 'The indexer to target',
      enum: ['tzstats', 'tzkt'],
    },
    page: {
      type: 'integer',
      default: 0,
      description: 'Current page index',
    },
    page_size: {
      type: 'integer',
      default: 1000,
      description: 'Current results limit applied',
    },
    order: {
      type: 'string',
      pattern: '^\\basc\\b|\\bdesc\\b$',
      default: 'asc',
      enum: ['asc', 'desc'],
    },
    job: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The id of the new job',
        },
        status: {
          type: 'string',
          description: 'the status of the operation corresponding to the job',
          example: 'forged',
        },
        forged_operation: {
          type: 'string',
          nullable: true,
          description: 'the raw forged operation corresponding to the job',
        },
        operation_hash: {
          type: 'string',
          nullable: true,
          description: 'the operation hash corresponding to the job',
        },
        operation_kind: {
          type: 'string',
          nullable: false,
          description: 'the operation type',
          enum: ['transaction', 'reveal'],
        },
      },
    },
  },
  parameters: {
    page: {
      name: 'page',
      in: 'query',
      schema: {
        $ref: '#/components/schemas/page',
      },
    },
    page_size: {
      name: 'page_size',
      in: 'query',
      schema: {
        $ref: '#/components/schemas/page_size',
      },
    },
  },
  requestBodies: {},
  headers: {},
  examples: {},
  links: {},
  responses: error,
};

export default components;
