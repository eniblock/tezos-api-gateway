import { IndexerEnum } from '../indexer';

export interface ConfigurationResponse {
  tezosNodesURLs: string[];
  tezosIndexers: ConfigurationIndexerResponse[];
}

export interface ConfigurationIndexerResponse {
  name: IndexerEnum;
  URL: string;
}
