import { TransactionDetails } from './send-transactions-params';

export interface GenericObject {
  [key: string]: unknown;
}

export type EntryPointParams = GenericObject | string | number | unknown[];

export interface ForgeOperationParams {
  transactions: TransactionDetails[];
  sourceAddress: string;
  callerId?: string;
}
