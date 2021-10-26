import { IndexerEnum } from './indexer';

export interface Transaction {
  id: number;
  destination: string;
  source: string;
  job_id: string;
  parameters?: string;
  parameters_json?: string;
  amount?: number;
  fee?: number;
  storage_limit?: number;
  gas_limit?: number;
  counter?: number;
  branch?: string;
  caller_id: string;
}

export interface IndexerTransaction {
  indexer: IndexerEnum;
  destination: string;
  source: string;
  timestamp: string;
  status: string;
  bakerFee: number;
  storageFee: number;
  storage_limit: number;
  counter: number;
  hash: string;
  block: string;
  type: string;
  height: number;
  entrypoint: string;
  parameters: object | string;
}
