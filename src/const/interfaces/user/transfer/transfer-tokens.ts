/**
 * Transfer transactions interface
 */
export interface TransferTransactions {
  amount: number;
  to: string;
}
/**
 * Transfer tokens params interface
 */
export interface TransferTokensParams {
  transactions: TransferTransactions[];
  callerId?: string;
}
