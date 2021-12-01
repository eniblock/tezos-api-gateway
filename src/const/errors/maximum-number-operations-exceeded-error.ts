export class MaximumNumberOperationsExceededError extends Error {
  constructor() {
    super(`Exceeded maximum number of operations authorized (5)`);
  }
}
