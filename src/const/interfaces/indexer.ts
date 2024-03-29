export interface IndexerConfig {
  name: IndexerEnum;
  apiUrl: string;
  pathToContractCalls: string;
  pathToTokenBalance?: string;
  pathToEvents?: string;
  keyToOperation: number | string;
  keyToBlockLevel: string;
  keyToOperationStatus: string;
  successStatus: string;
  pathToOperation: string;
  pathToUserInfo: string;
  keyToCreationDate: string;
  keyToBalance: string;
  balanceUnit: number;
  keyToReveal: string;
}

export enum IndexerEnum {
  // TZSTATS = 'tzstats',
  TZKT = 'tzkt',
}
