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
    hex_string: {
      type: 'string',
      pattern: '^(0x|0X)?([a-fA-F0-9][a-fA-F0-9])+$',
      description: 'hexadecimal string',
      example: '0507070a0000001601fcc8bfe353d8b099e0e6e675b4e2',
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
    tezos_signature: {
      type: 'string',
      pattern: '^edsig+[0-9a-zA-Z]{94}$',
      description: 'A tezos signature',
      example:
        'edsigtyMscdmpDVX1P5PetJsdbdbJu1w4jQCF2sr4H2NEW8LL1QbdoJvJTbnViQtrZSPHuYKPK3gyUMCxh83LVmL1Lg6qjgaQe4',
    },
    tezos_contract_address: {
      type: 'string',
      pattern: '^KT+[0-9a-zA-Z]{34}$',
      description: 'A tezos smart contract address',
      example: flexibleTokenContract,
    },
    tezos_operation_hash: {
      type: 'string',
      pattern: '^o+[0-9a-zA-Z]{50}$',
      description: 'A tezos operation hash',
      example: 'oomTc6iifGUafAGriqHwsqcKre8fty6Y9hRbseCzWk74syy9rPd',
    },
    amount: {
      type: 'integer',
      default: 0,
      minimum: 0,
      description:
        'Amount of XTZ tokens transferred in the transaction, in mutez (1 XTZ = 10⁶ mutez)',
    },
    fee: {
      type: 'integer',
      nullable: true,
      minimum: 1,
      description:
        'Amount of XTZ Tez to pay the transaction gas fee, in mutez (1 XTZ = 10⁶ mutez)',
    },
    callerId: {
      nullable: true,
      type: 'string',
      description: 'The identifier of the calling application',
    },
    indexer: {
      type: 'string',
      pattern: '^\\btzstats\\b|\\btzkt\\b$',
      description: 'The indexer to target',
      enum: ['tzstats', 'tzkt'],
    },
    only_tzkt_indexer: {
      type: 'string',
      pattern: '^|\\btzkt\\b$',
      description: 'The indexer to target',
      enum: ['tzkt'],
      default: 'tzkt',
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
    extended_job: {
      type: 'object',
      allOf: [
        {
          $ref: '#/components/schemas/job',
        },
        {
          properties: {
            fee: {
              $ref: '#/components/schemas/fee',
            },
            gas: {
              type: 'integer',
              nullable: true,
              description: 'Gas consumption estimation',
            },
          },
        },
      ],
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
