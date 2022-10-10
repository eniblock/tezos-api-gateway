import { IndexerEnum } from '../../indexer';

export interface Token {
  contract: string | null;
  tokenId: number | null;
  standard: string | null;
  totalSupply: number | null;
  metadata: any;
}

export interface TokenBalance {
  indexer: IndexerEnum;
  account: string;
  balance: number | null;
  token: Token | null;
}
