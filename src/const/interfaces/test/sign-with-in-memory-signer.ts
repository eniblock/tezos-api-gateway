/**
 * In memory signing params interface
 */
export interface InMemorySignerParams {
  privateKey: string;
  forgedOperation: string;
}

/**
 * In memory signing result object
 */
export interface InMemorySignerResult {
  signedOperation: string;
  signature: string;
}
