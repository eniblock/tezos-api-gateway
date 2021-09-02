import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { AddressNotFoundError } from '../../../../const/errors/address-not-found-error';
import {
  InvalidEntryPointParams,
  InvalidMapStructureParams,
} from '../../../../const/errors/invalid-entry-point-params';
import { forgeOperation } from '../../../../lib/jobs/forge-operation';
import { GatewayPool } from '../../../../services/gateway-pool';
import { logger } from '../../../../services/logger';
import { PostgreService } from '../../../../services/postgre';

type ReqQuery = { useCache: boolean };

function forgeOperationAndCreateJob(
  gatewayPool: GatewayPool,
  postgreClient: PostgreService,
) {
  return async (
    req: Request<any, any, any, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { transactions, sourceAddress, callerId } = req.body;
      const { useCache } = req.query;

      logger.info(
        {
          transactions,
          sourceAddress,
          callerId,
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
          callerId,
          useCache,
        },
        tezosService,
        postgreClient,
      );

      return res.status(StatusCodes.CREATED).json(job);
    } catch (err) {
      if (err instanceof AddressNotFoundError) {
        return next(createHttpError(StatusCodes.NOT_FOUND, err.message));
      } else if (
        err instanceof InvalidEntryPointParams ||
        err instanceof InvalidMapStructureParams
      ) {
        return next(createHttpError(StatusCodes.BAD_REQUEST, err.message));
      }

      return next(err);
    }
  };
}

export default { forgeOperationAndCreateJob };
