export class UndefinedPublicKeyError extends Error {
  constructor(keyName: string) {
    super(`Public key regarding this key ${keyName} is undefined`);
  }
}
