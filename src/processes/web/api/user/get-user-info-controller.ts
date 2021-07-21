import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { IndexerPool } from '../../../../services/indexer-pool';
import { UserNotFoundError } from '../../../../const/errors/indexer-error';

/**
 * @description       - Handler to fetch user information
 * @param indexerPool - The pool that gives us a indexer like tzstat, conseil, etc..
 */
function getUserinfo(indexerPool: IndexerPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;

      logger.info(
        {
          address,
        },
        '[user/get-user-info-controller] Get user info for the following user',
      );

      const nbOfRetry = 4;
      const userInfo = await indexerPool.getUserInfoByRandomIndexer(
        address,
        nbOfRetry,
      );

      if (!userInfo) {
        throw createHttpError(
          StatusCodes.BAD_GATEWAY,
          `Could not perform task number of retry: ${nbOfRetry}`,
        );
      }

      res.status(StatusCodes.OK).json(userInfo);
    } catch (err) {
      if (err instanceof UserNotFoundError) {
        return next(createHttpError(StatusCodes.BAD_REQUEST, err.message));
      }

      return next(err);
    }
  };
}

export default { getUserinfo };
