import { GatewayPool } from '../../../../services/gateway-pool';
import { PostgreService } from '../../../../services/postgre';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { AddressAlreadyRevealedError } from '../../../../const/errors/address-already-revealed';
import createHttpError from 'http-errors';
import { forgeRevealOperation } from '../../../../lib/jobs/forge-reveal-operation';
import { RevealEstimateError } from '../../../../const/errors/reveal-estimate-error';
import { ForgeRevealOperationParams } from '../../../../const/interfaces/forge-reveal-operation-params';

function forgeRevealOperationAndCreateJob(
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address, publicKey, callerId, fee }: ForgeRevealOperationParams =
        req.body;
      logger.info(
        '[jobs/forge-reveal-job-controller] %s wants to reveal the address %s with the public key %s',
        callerId,
        address,
        publicKey,
        fee,
      );

      const accounts = await forgeRevealOperation(
        gatewayPool,
        postgreService,
        address,
        publicKey,
        callerId,
        fee,
      );

      return res.status(StatusCodes.CREATED).json(accounts);
    } catch (err) {
      if (err instanceof AddressAlreadyRevealedError) {
        return next(createHttpError(StatusCodes.CONFLICT, err.message));
      }
      if (err instanceof RevealEstimateError) {
        return next(createHttpError(StatusCodes.BAD_REQUEST, err.message));
      }
      return next(err);
    }
  };
}

export default { forgeRevealOperationAndCreateJob };
