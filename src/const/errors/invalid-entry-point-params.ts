import { EntryPointParams } from '../interfaces/forge-operation-params';

export class InvalidEntryPointParams extends Error {
  constructor(schema: unknown, params: EntryPointParams) {
    super(
      `The given entry point params ${JSON.stringify(
        params,
      )} does not match the schema: ${JSON.stringify(schema)}`,
    );
  }
}

export class InvalidMapStructureParams extends Error {
  constructor(parameterName: string) {
    super(`"${parameterName}" does not match the structure of a map`);
  }
}
