import { ContractMethod } from '@taquito/taquito/dist/types/contract/contract';
import { ContractProvider } from '@taquito/taquito/dist/types/contract/interface';

export class TestContractMethod {
  get schema(): unknown {
    return null;
  }
  send(_params?: unknown) {
    return { hash: 'hashValue' };
  }
  toTransferParams(_params?: unknown) {
    return 'toTransferParams';
  }
}

export class TestOperationBatch {
  withContractCall(_params: ContractMethod<ContractProvider>) {
    return this;
  }

  send() {
    return Promise.resolve({ hash: 'hashValue' });
  }
}
