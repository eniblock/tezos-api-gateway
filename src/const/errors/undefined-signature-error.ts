export class UndefinedSignatureError extends Error {
  constructor(keyName: string, forgedOperation: string) {
    super(
      `Could not sign the forge: ${forgedOperation} with the key ${keyName}`,
    );
  }
}
