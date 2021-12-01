import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { AddressNotFoundError } from '../../../../const/errors/address-not-found-error';
import {
  InvalidEntryPointParams,
  InvalidMapStructureParams,
  PublicKeyUndefined,
} from '../../../../const/errors/invalid-entry-point-params';
import { forgeOperation } from '../../../../lib/jobs/forge-operation';
import { GatewayPool } from '../../../../services/gateway-pool';
import { logger } from '../../../../services/logger';
import { PostgreService } from '../../../../services/postgre';
import { AddressNotRevealedError } from '../../../../const/errors/address-not-revealed';
import { RevealEstimateError } from '../../../../const/errors/reveal-estimate-error';
import { AddressAlreadyRevealedError } from '../../../../const/errors/address-already-revealed';
import { MaximumNumberOperationsExceededError } from '../../../../const/errors/maximum-number-operations-exceeded-error';

type ReqQuery = { useCache: boolean; reveal: boolean };

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
      const { transactions, sourceAddress, callerId, publicKey } = req.body;
      const { useCache, reveal } = req.query;
      let maxOpAuthorized = 5;

      if (reveal) {
        if (publicKey === undefined) throw new PublicKeyUndefined();
        maxOpAuthorized = 4;
      }
      if (transactions.length > maxOpAuthorized)
        throw new MaximumNumberOperationsExceededError();
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
        '[jobs/forge-job-controller] Using this tezos node',
      );

      const job = await forgeOperation(
        {
          transactions,
          sourceAddress,
          callerId,
          publicKey,
          useCache,
          reveal,
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
        err instanceof InvalidMapStructureParams ||
        err instanceof PublicKeyUndefined ||
        err instanceof AddressNotRevealedError ||
        err instanceof RevealEstimateError ||
        err instanceof AddressAlreadyRevealedError ||
        err instanceof MaximumNumberOperationsExceededError
      ) {
        return next(createHttpError(StatusCodes.BAD_REQUEST, err.message));
      }

      return next(err);
    }
  };
}
export default { forgeOperationAndCreateJob };
