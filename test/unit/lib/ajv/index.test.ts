import { validateSchema, ValidationError } from '../../../../src/lib/ajv';

describe('[lib/ajv/index.js]', () => {
  describe('validateSchema', () => {
    it('should not throw any errors when the model matches the schema', () => {
      const schema = {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
          },
        },
      };
      const model = {
        name: 'toto',
      };

      expect(validateSchema(schema, model)).toBeUndefined();
    });

    it('should throw ValidationError when the model does not match the schema', () => {
      const schema = {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
          },
        },
      };
      const model = {
        name: 123,
      };

      let error;

      try {
        validateSchema(schema, model);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        {
          dataPath: '/name',
          keyword: 'type',
          message: 'should be string',
          params: {
            type: 'string',
          },
          schemaPath: '#/properties/name/type',
        },
      ]);
    });
  });
});
