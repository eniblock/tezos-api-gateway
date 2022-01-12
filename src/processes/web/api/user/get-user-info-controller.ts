import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { IndexerPool } from '../../../../services/indexer-pool';
import { UserNotFoundError } from '../../../../const/errors/indexer-error';

/**
 * @description       - Handler to fetch user information
 * @param indexerPool - The pool that gives us a indexer like tzstat, tzkt, etc..
 */
function getUserInfo(indexerPool: IndexerPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;

      logger.info(
        {
          address,
        },
        '[user/get-user-info-controller] Get user info for the following user',
      );

      const userInfo = await indexerPool.getUserInfoByRandomIndexer(address);

      res.status(StatusCodes.OK).json(userInfo);
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        return next(createHttpError(StatusCodes.NOT_FOUND, err.message));
      }

      return next(err);
    }
  };
}

export default { getUserInfo };
