export interface IndexerConfig {
  name: string;
  apiUrl: string;
  keyToOperation: number | string;
  keyToBlockLevel: string;
  apiKey?: string;
  pathToOperation: string;
  pathToUserInfo: string;
  keyToBalance?: string;
  keyToReveal?: string;
}
