export class InvalidMapStructureParams extends Error {
  constructor() {
    super(
      `Invalid map structure, map have to respect the type: {"key": <key>, "value": <value>}[]`,
    );
  }
}

export class InvalidParameterName extends Error {
  constructor(parameterName: string) {
    super(
      `Invalid parameter name, No child object has the name "${parameterName}"`,
    );
  }
}

export class MissingParameter extends Error {
  constructor(parameterName: string) {
    super(
      `Missing parameter name, No child object has the name "${parameterName}"`,
    );
  }
}

export class UnKnownParameterType extends Error {
  constructor(parameterType: string) {
    super(`Unknown parameter type "${parameterType}"`);
  }
}

export class InvalidVariantObject extends Error {
  constructor(itemsNumber: number) {
    super(`Invalid variant object, expected 1 item but got ${itemsNumber}`);
  }
}

export class PublicKeyUndefined extends Error {
  constructor() {
    super(`publicKey should be defined when reveal is true`);
  }
}
