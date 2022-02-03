import { IndexerEnum } from '../indexer';

export interface ContractTransactionsParams {
  order?: string;
  entrypoint?: string;
  limit?: number;
  offset?: number;
  parameter?: string;
  indexer?: IndexerEnum;
}
