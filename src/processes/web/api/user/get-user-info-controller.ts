import { NextFunction, Request, Response } from 'express';
import createHttpError from "http-errors";

import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { IndexerPool } from '../../../../services/indexer-pool';

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

      const userInfo = await indexerPool.getUserInfoByRandomIndexer(address, 4);
      if (!userInfo) {
        throw createHttpError(StatusCodes.BAD_GATEWAY)
      }

      res.status(StatusCodes.OK).json(userInfo);
    } catch (err) {
      return next(err);
    }
  };
}

export default { getUserinfo };
