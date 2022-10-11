import { IndexerEnum } from '../../const/interfaces/indexer';
import { TokenBalance } from '../../const/interfaces/user/token-balance/token-balance';

/**
 * Convert the token/balance result returned by Tzkt indexer to our TokenBalance interface
 *
 * @return {object} the token balance
 * @param tokenBalanceResult
 */

export function mapTzktTokenBalance(tokenBalanceResult: any): TokenBalance {
  return {
    indexer: IndexerEnum.TZKT,
    account: tokenBalanceResult.account?.address,
    balance: Number(tokenBalanceResult.balance),
    token: {
      contract: tokenBalanceResult.token?.contract?.address,
      tokenId: Number(tokenBalanceResult.token?.tokenId),
      standard: tokenBalanceResult.token?.standard,
      totalSupply: Number(tokenBalanceResult.token?.totalSupply),
      metadata: tokenBalanceResult.token?.metadata,
    },
  };
}
