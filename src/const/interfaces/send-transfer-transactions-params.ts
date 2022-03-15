import { TransferTransactions } from './user/transfer/transfer-tokens';
import { VaultSigner } from '../../services/signers/vault';

export interface SendTransferTransactionsParams {
  transactions: TransferTransactions[];
  vaultSigner: VaultSigner;
  callerId?: string;
}

export type SendTransferTransactionsToQueueParams =
  SendTransferTransactionsParams & {
    jobId: number;
  };
