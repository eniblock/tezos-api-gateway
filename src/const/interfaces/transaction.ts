import { IndexerEnum } from './indexer';
import { OpKind } from '@taquito/rpc';

export interface Operation {
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
  kind: OpKind.REVEAL | OpKind.TRANSACTION;
  public_key?: string;
}

export interface IndexerTransaction {
  indexer: IndexerEnum;
  destination: string;
  source: string;
  timestamp: string;
  status: string;
  baker_fee: number;
  storage_fee: number;
  storage_limit: number;
  counter: number;
  hash: string;
  block: string;
  type: string;
  height: number;
  entrypoint: string;
  parameters: object | string;
}
