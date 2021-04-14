import Ajv, { ErrorObject } from 'ajv';
import { Schema } from 'ajv/lib/types/index';

export class ValidationError extends Error {
  private _errors: ErrorObject[];

  public get errors() {
    return this._errors;
  }

  constructor(errors: ErrorObject[]) {
    super('Ajv Validation Error');
    this._errors = errors;
  }
}

/**
 * Validate a model with the given schema
 *
 * @param {object} schema   - the schema used to validate
 * @param {unknown} model   - the data that need to be validated
 *
 * @return {void} Throw an error if the model does not match the schema
 */
export function validateSchema(schema: Schema, model: unknown) {
  const ajValidator = new Ajv({ allErrors: true });
  const validate = ajValidator.compile(schema);
  const result = validate(model);
  if (!result) {
    throw new ValidationError(validate.errors!);
  }
}
