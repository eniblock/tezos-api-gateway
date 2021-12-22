import { TransactionDetails } from './send-transactions-params';

export interface GenericObject {
  [key: string]: unknown;
}

export type EntryPointParams =
  | GenericObject
  | boolean
  | string
  | number
  | unknown[];

export interface ForgeOperationBodyParams {
  transactions: TransactionDetails[];
  sourceAddress: string;
  callerId?: string;
  publicKey?: string;
}

export interface ForgeOperationQueryParams {
  useCache: boolean;
  reveal: boolean;
}

export interface ForgeOperationParams
  extends ForgeOperationBodyParams,
    ForgeOperationQueryParams {}
