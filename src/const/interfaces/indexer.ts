export interface IndexerConfig {
  name: IndexerEnum;
  apiUrl: string;
  pathToContractCalls: string;
  keyToOperation: number | string;
  keyToBlockLevel: string;
  apiKey?: string;
  pathToOperation: string;
  pathToUserInfo: string;
  keyToBalance?: string;
  keyToReveal?: string;
}

export enum IndexerEnum {
  TZSTATS = 'tzstats',
  TZKT = 'tzkt',
}
