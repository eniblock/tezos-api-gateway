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
  constructor() {
    super(
      `Invalid map structure, map have to respect the type: {"key": <key>, "value": <value>}[]`,
    );
  }
}

export class PublicKeyUndefined extends Error {
  constructor() {
    super(`publicKey should be defined when reveal is true`);
  }
}
