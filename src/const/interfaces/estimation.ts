export interface Estimation {
  kind: string;
  source: string;
  destination?: string;
  parameters?: any;
  parametersJson?: any;
  amount?: number;
  public_key?: string;
  counter: number;
  suggestedFee: number;
  minimalFee: number;
  gasEstimation: number;
  gasLimit: number;
  storageLimit: number;
  storageAndAllocationFee: number;
}
