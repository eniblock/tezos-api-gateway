import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { vaultClientConfig } from '../../../../config';
import {
  InvalidEntryPointParams,
  InvalidMapStructureParams,
} from '../../../../const/errors/invalid-entry-point-params';
import { VaultClient } from '../../../../services/clients/vault-client';
import { GatewayPool } from '../../../../services/gateway-pool';
import { logger } from '../../../../services/logger';

function getUser(gatewayPool: GatewayPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Declaration of request parameters
      const { userIdList: users } = req.params;
      logger.info(
        {
          users,
        },
        '[user/get-user-controller] User creation with the following data',
      );

      const tezosService = await gatewayPool.getTezosService();

      logger.info(
        {
          tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        },
        '[user/get-user-controller] Using this tezos node',
      );

      const vaultClient = new VaultClient(vaultClientConfig, logger);
      const accounts = await (users as any).map(async (user: string) => {
        return {
          userId: user,
          account: await vaultClient.getPublicKey(user),
        };
      });

      return res.status(StatusCodes.CREATED).json(accounts);
    } catch (err) {
      /* if (err instanceof AddressNotFoundError) {
        return next(createHttpError(StatusCodes., err.message));
      } */

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

export default { getUser };
