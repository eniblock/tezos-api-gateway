export class OperationNotFoundError extends Error {
  constructor(operationHash: string) {
    super(`Could not find an operation with this hash: ${operationHash}`);
    this.name = 'Operation not found';
  }
}
