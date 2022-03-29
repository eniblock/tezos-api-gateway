/**
 * Sign data params interface
 */
export interface SignDataParams {
  bytesToSign: string;
}

/**
 * Sign data result object
 */
export interface SignDataResult {
  signedData: string;
  signature: string;
}
