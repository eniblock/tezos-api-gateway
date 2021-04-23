import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { AddressNotFoundError } from '../../../../const/errors/address-not-found-error';
import {
  InvalidEntryPointParams,
  InvalidMapStructureParams,
} from '../../../../const/errors/invalid-entry-point-params';
import { createAccounts } from '../../../../lib/user/create-account';
import { GatewayPool } from '../../../../services/gateway-pool';
import { logger } from '../../../../services/logger';

function createUser(gatewayPool: GatewayPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Declaration of request parameters
      const { userIdList, secureKeyName } = req.body;
      logger.info(
        {
          userIdList,
          secureKeyName,
        },
        '[user/create-user-controller] User creation with the following data',
      );

      const tezosService = await gatewayPool.getTezosService();

      logger.info(
        {
          tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        },
        '[user/create-user-controller] Using this tezos node',
      );

      const result = await createAccounts(
        userIdList,
        secureKeyName,
        tezosService,
      );
      return res.status(StatusCodes.CREATED).json(result);
    } catch (err) {
      if (err instanceof AddressNotFoundError) {
        return next(createHttpError(StatusCodes.NOT_FOUND, err.message));
      }

      if (
        err instanceof InvalidEntryPointParams ||
        err instanceof InvalidMapStructureParams
      ) {
        return next(createHttpError(StatusCodes.BAD_REQUEST, err.message));
      }

      return next(err);
    }
  };
}

export default { createUser };
