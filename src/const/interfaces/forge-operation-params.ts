import { TransactionDetails } from './send-transactions-params';

export interface GenericObject {
  [key: string]: unknown;
}

export type EntryPointParams = GenericObject | string | number | unknown[];

export interface ForgeOperationBodyParams {
  transactions: TransactionDetails[];
  sourceAddress: string;
  callerId?: string;
}

export interface ForgeOperationQueryParams {
  useCache: boolean;
}

export interface ForgeOperationParams
  extends ForgeOperationBodyParams,
    ForgeOperationQueryParams {}
