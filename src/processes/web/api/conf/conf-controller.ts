import { NextFunction, Request, Response } from 'express';

import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { IndexerPool } from '../../../../services/indexer-pool';
import { getConfiguration } from '../../../../lib/conf/get-configuration';
import { GatewayPool } from '../../../../services/gateway-pool';

export default { getConf };

function getConf(indexerPool: IndexerPool, gatewayPool: GatewayPool) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[conf/conf-controller] Requesting configuration');

      const configuration = getConfiguration(indexerPool, gatewayPool);

      return res.status(StatusCodes.OK).json(configuration);
    } catch (err) {
      return next(err);
    }
  };
}
