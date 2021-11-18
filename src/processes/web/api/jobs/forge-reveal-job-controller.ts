import { GatewayPool } from '../../../../services/gateway-pool';
import { PostgreService } from '../../../../services/postgre';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { AddressAlreadyRevealedError } from '../../../../const/errors/address-already-revealed';
import createHttpError from 'http-errors';
import { forgeRevealOperation } from '../../../../lib/jobs/forge-reveal-operation';
import { RevealEstimateError } from '../../../../const/errors/reveal-estimate-error';

function forgeRevealOperationAndCreateJob(
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address, publicKey } = req.body;
      logger.info(
        '[jobs/forge-reveal-job-controller] Reveal the address %s with the public key %s',
        address,
        publicKey,
      );

      const accounts = await forgeRevealOperation(
        gatewayPool,
        postgreService,
        address,
        publicKey,
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
