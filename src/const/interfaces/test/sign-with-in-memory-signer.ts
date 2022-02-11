/**
 * In memory signing params interface
 */
import { GenericObject } from '../forge-operation-params';

export interface InMemorySignerParams {
  privateKey: string;
  bytesToSign: string;
}

/**
 * vault signing params interface
 */
export interface VaultSignerParams {
  secureKeyName: string;
  bytesToSign: string;
}

/**
 * signature checking params interface
 */
export interface CheckSignatureParams {
  signature: string;
  publicKey: string;
  signedPayload: string;
}

/**
 * packing data params interface
 */
export interface DataPackingParams {
  data: GenericObject;
  type: GenericObject;
}

/**
 * In memory signing result object
 */
export interface InMemorySignerResult {
  signedOperation: string;
  signature: string;
}
