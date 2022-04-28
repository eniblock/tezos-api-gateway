export class OperationNotFoundError extends Error {
  constructor(operationHash: string) {
    super(`Could not find an operation with this hash: ${operationHash}`);
    this.name = 'Operation not found';
  }
}

export class UserNotFoundError extends Error {
  constructor(userAddress: string) {
    super(`Could not find an user with this address: ${userAddress}`);
  }
}

export class UnsupportedIndexerError extends Error {
  constructor(indexerName: string) {
    super(`Could not use the indexer ${indexerName} for this action`);
  }
}

export class OperationExpiredError extends Error {
  constructor(operationHash: string) {
    super(`The operation with this hash is now expired: ${operationHash}`);
    this.name = 'Operation expired';
  }
}
