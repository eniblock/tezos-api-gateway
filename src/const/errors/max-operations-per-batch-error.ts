export class MaxOperationsPerBatchError extends Error {
  constructor() {
    super(`Exceeded maximum number of operations per batch authorized (5)`);
  }
}
