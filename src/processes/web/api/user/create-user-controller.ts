import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  activateAndRevealAccounts,
  createAccounts,
} from '../../../../lib/user/create-account';
import { GatewayPool } from '../../../../services/gateway-pool';
import { logger } from '../../../../services/logger';
import { CreateUserParams } from '../../../../const/interfaces/user/create/create-user-params';
import { VaultSigner } from '../../../../services/signers/vault';
import { vaultClientConfig } from '../../../../config';

function createUser(gatewayPool: GatewayPool, activateAndReveal: boolean) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userIdList, secureKeyName }: CreateUserParams = req.body;
      logger.info(
        {
          userIdList,
          secureKeyName,
        },
        '[user/create-user-controller] User creation with the following data',
      );

      const result = await createAccounts(userIdList);

      logger.info(
        result,
        '[user/create-user-controller] Created accounts for the following users ',
      );

      if (activateAndReveal) {
        const tezosService = await gatewayPool.getTezosService();

        logger.info(
          {
            tezosNode: tezosService.tezos.rpc.getRpcUrl(),
          },
          '[user/create-user-controller] Using this tezos node',
        );

        const signer = new VaultSigner(
          vaultClientConfig,
          secureKeyName,
          logger,
        );

        await activateAndRevealAccounts(tezosService, signer, {
          userIdList,
          secureKeyName,
        });

        logger.info(
          result,
          '[user/create-user-controller] Activated and revealed accounts for the following users ',
        );
      }

      return res.status(StatusCodes.CREATED).json(result);
    } catch (err) {
      return next(err);
    }
  };
}

export default { createUser };
