import { ContractMethod } from '@taquito/taquito';
import { ContractProvider } from '@taquito/taquito/dist/types/contract/interface';

export class TestContractMethod {
  get schema(): unknown {
    return null;
  }
  send(_params?: unknown) {
    return Promise.resolve({ hash: 'hashValue' });
  }
  toTransferParams(_params?: unknown) {
    return 'toTransferParams';
  }
}

export class TestOperationBatch {
  withTransfer(_params: ContractMethod<ContractProvider>) {
    return this;
  }

  send() {
    return Promise.resolve({ hash: 'hashValue' });
  }
}
