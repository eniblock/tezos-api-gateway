import { EntryPointParams } from './forge-operation-params';

export interface TransactionParametersJson {
  entrypoint: string;
  call?: string;
  value: {
    [key: string]: EntryPointParams;
  };
}
