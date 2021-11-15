import { EntryPointParams } from './forge-operation-params';
import { OperationContentsTransaction } from '@taquito/rpc';
import { TransactionParametersJson } from './transaction-parameters-json';
import { OperationContentsReveal } from '@taquito/rpc/dist/types/types';

export interface TransactionDetails {
  contractAddress: string;
  entryPoint: string;
  entryPointParams?: EntryPointParams;
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

export type OperationContentsRevealWithParametersJson = OperationContentsReveal & {
  parametersJson: TransactionParametersJson;
};

export type OperationContentsTransactionWithParametersJson = OperationContentsTransaction & {
  parametersJson: TransactionParametersJson;
};
