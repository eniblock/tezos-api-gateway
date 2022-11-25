import { EntryPointParams } from './forge-operation-params';
import { OperationContentsTransaction } from '@taquito/rpc';
import { TransactionParametersJson } from './transaction-parameters-json';

export interface TransactionDetails {
  contractAddress: string;
  entryPoint: string;
  entryPointParams?: EntryPointParams;
  amount?: number;
  fee?: number;
}

export interface SendTransactionsParams {
  transactions: TransactionDetails[];
  secureKeyName: string;
  callerId?: string;
  useCache: boolean;
}

export type SendTransactionsToQueueParams = SendTransactionsParams & {
  jobId: number;
  callerId?: string;
};

export type OperationContentsTransactionWithParametersJson =
  OperationContentsTransaction & {
    parametersJson: TransactionParametersJson;
  };
