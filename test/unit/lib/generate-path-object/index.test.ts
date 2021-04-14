import { generateSchemaObject } from '../../../../src/lib/generate-path-object';

describe('[lib/generate-path-object] Index', () => {
  describe('#generateSchemaObject', () => {
    it('should correctly return the schema object when tezos entry point schema is "list"', () => {
      expect(generateSchemaObject('list')).toEqual({
        $ref: '#/components/schemas/flexible_array',
      });
    });

    it('should correctly return the schema object when tezos entry point schema is "string"', () => {
      expect(generateSchemaObject('string')).toEqual({
        type: 'string',
      });
    });

    it('should correctly return the schema object when tezos entry point schema is "nat"', () => {
      expect(generateSchemaObject('nat')).toEqual({
        type: 'number',
      });
    });

    it('should correctly return the schema object when tezos entry point schema is "int"', () => {
      expect(generateSchemaObject('int')).toEqual({
        type: 'number',
      });
    });

    it('should correctly return the schema object when tezos entry point schema is "bool"', () => {
      expect(generateSchemaObject('bool')).toEqual({
        type: 'boolean',
      });
    });

    it('should correctly return the schema object when tezos entry point schema is an object', () => {
      expect(
        generateSchemaObject({ requests: 'list', callback: 'contract' }),
      ).toEqual({
        type: 'object',
        additionalProperties: false,
        required: ['requests', 'callback'],
        properties: {
          requests: {
            $ref: '#/components/schemas/flexible_array',
          },
          callback: {
            type: 'object',
          },
        },
      });
    });

    it('should correctly return the schema object when tezos entry point schema is a complex object', () => {
      expect(
        generateSchemaObject({
          address: 'address',
          amount: 'nat',
          metadata: { map: { key: 'string', value: 'bytes' } },
          token_id: 'nat',
        }),
      ).toEqual({
        type: 'object',
        additionalProperties: false,
        required: ['address', 'amount', 'metadata', 'token_id'],
        properties: {
          address: {
            $ref: '#/components/schemas/tezos_address',
          },
          amount: {
            type: 'number',
          },
          metadata: {
            type: 'object',
            additionalProperties: false,
            required: ['key', 'value'],
            properties: {
              key: {
                type: 'string',
              },
              value: {
                type: 'string',
                pattern: '^[0-9a-zA-Z]$',
                description: 'A bytes string',
                example: '54686520546f6b656e204f6e65',
              },
            },
          },
          token_id: {
            type: 'number',
          },
        },
      });
    });
  });
});
