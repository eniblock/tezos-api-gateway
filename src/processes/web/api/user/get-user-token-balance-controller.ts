import { NextFunction, Request, Response } from 'express';

import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { IndexerPool } from '../../../../services/indexer-pool';
import { TokenBalanceParams } from '../../../../const/interfaces/user/token-balance/get-user-token-balance-params';
import { IndexerEnum } from '../../../../const/interfaces/indexer';

/**
 * @description       - Handler to fetch token balance
 * @param indexerPool - The pool that gives us a indexer like tzstat, tzkt, etc..
 */
function getUserTokenBalance(indexerPool: IndexerPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { account } = req.params;
      const params: TokenBalanceParams = req.query || {};

      logger.info(
        {
          account,
          filterParams: params,
        },
        '[user/get-user-token-balance-controller] Get user token balance for the following user',
      );

      const indexer = indexerPool.getSpecificIndexer(IndexerEnum.TZKT);
      const userTokenBalance = await indexer.getTokenBalance(account, params);

      res.status(StatusCodes.OK).json(userTokenBalance);
    } catch (err) {
      return next(err);
    }
  };
}

export default { getUserTokenBalance };
