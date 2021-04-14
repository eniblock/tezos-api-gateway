export class MissingMessageValidationSchemaError extends Error {
  constructor() {
    super('Missing the validation schema');
  }
}
