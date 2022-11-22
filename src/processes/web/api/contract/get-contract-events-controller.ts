import { NextFunction, Request, Response } from 'express';

import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { IndexerPool } from '../../../../services/indexer-pool';
import { IndexerEnum } from '../../../../const/interfaces/indexer';
import { GetEventsQueryParams } from '../../../../const/interfaces/contract/events/get-events-query-params';
import { EventsResult } from '../../../../const/interfaces/contract/events/events-result';

/**
 * @description       - Handler to fetch contract events
 * @param indexerPool - The pool that gives us a indexer like tzstat, tzkt, etc..
 */
function getContractEvents(indexerPool: IndexerPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params: GetEventsQueryParams = req.query || {};

      logger.info(
        {
          filterParams: params,
        },
        '[events/get-contract-events-controller] Get events list based on the latest filters',
      );

      const indexer = indexerPool.getSpecificIndexer(IndexerEnum.TZKT);
      const eventsResult: EventsResult[] = await indexer.getContractEvents(
        params,
      );

      res.status(StatusCodes.OK).json(eventsResult);
    } catch (err) {
      return next(err);
    }
  };
}

export default { getContractEvents };
