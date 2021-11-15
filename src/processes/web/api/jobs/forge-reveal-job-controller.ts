import { GatewayPool } from '../../../../services/gateway-pool';
import { PostgreService } from '../../../../services/postgre';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { AddressAlreadyRevealedError } from '../../../../const/errors/address-already-revealed';
import createHttpError from 'http-errors';
import { forgeRevealOperation } from '../../../../lib/jobs/forge-reveal-operation';

function forgeRevealOperationAndCreateJob(
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.body;
      logger.info(
        {
          address,
        },
        '[jobs/forge-reveal-job-controller] Reveal the following address',
      );

      const accounts = await forgeRevealOperation(
        gatewayPool,
        postgreService,
        address,
      );

      return res.status(StatusCodes.CREATED).json(accounts);
    } catch (err) {
      if (err instanceof AddressAlreadyRevealedError) {
        return next(createHttpError(StatusCodes.CONFLICT, err.message));
      }
      return next(err);
    }
  };
}

export default { forgeRevealOperationAndCreateJob };
