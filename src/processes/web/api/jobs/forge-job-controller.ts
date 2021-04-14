import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { BAD_REQUEST, CREATED, NOT_FOUND } from 'http-status-codes';

import { logger } from '../../../../services/logger';
import { forgeOperation } from '../../../../lib/jobs/forge-operation';
import { PostgreService } from '../../../../services/postgre';
import { AddressNotFoundError } from '../../../../const/errors/address-not-found-error';
import {
  InvalidEntryPointParams,
  InvalidMapStructureParams,
} from '../../../../const/errors/invalid-entry-point-params';
import { GatewayPool } from '../../../../services/gateway-pool';

function forgeOperationAndCreateJob(
  gatewayPool: GatewayPool,
  postgreClient: PostgreService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { transactions, sourceAddress } = req.body;

      logger.info(
        {
          transactions,
          sourceAddress,
        },
        '[jobs/forge-job-controller] Forge operation with the following data',
      );

      const tezosService = await gatewayPool.getTezosService();

      logger.info(
        {
          tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        },
        '[storage/forge-job-controller] Using this tezos node',
      );

      const job = await forgeOperation(
        {
          transactions,
          sourceAddress,
        },
        tezosService,
        postgreClient,
      );

      return res.status(CREATED).json(job);
    } catch (err) {
      if (err instanceof AddressNotFoundError) {
        return next(createHttpError(NOT_FOUND, err.message));
      }

      if (
        err instanceof InvalidEntryPointParams ||
        err instanceof InvalidMapStructureParams
      ) {
        return next(createHttpError(BAD_REQUEST, err.message));
      }

      return next(err);
    }
  };
}

export default { forgeOperationAndCreateJob };
