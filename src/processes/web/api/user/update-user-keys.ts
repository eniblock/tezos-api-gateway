import { NextFunction, Request, Response } from 'express';
import { UpdateUserKeysParams } from '../../../../const/interfaces/user/update/update-user-keys';
import { logger } from '../../../../services/logger';
import { VaultClient } from '../../../../services/clients/vault-client';
import { vaultClientConfig } from '../../../../config';
import { UndefinedUserIdError } from '../../../../const/errors/undefined-user-id';
import { StatusCodes } from 'http-status-codes';

function selfManaged() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, publicKey }: UpdateUserKeysParams = req.body;

      logger.info(
        { userId, publicKey },
        '[user/update-user-keys] updating self-managed user keys with the following data',
      );

      const vaultClient = new VaultClient(vaultClientConfig, logger);
      const pkh = await vaultClient.getSecret(
        'self-managed',
        userId,
        'publicKey',
      );

      if (pkh) {
        await vaultClient.setSecret(
          'self-managed',
          userId,
          'publicKey',
          publicKey,
        );
        return res.status(StatusCodes.NO_CONTENT).end();
      } else {
        throw new UndefinedUserIdError(userId);
      }
    } catch (e) {
      return next(e);
    }
  };
}

function delegated() {
  return async (_: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[user/update-user-keys] updating delegated user keys');

      const vaultClient = new VaultClient(vaultClientConfig, logger);
      const names = await vaultClient.getAllTransitNames();

      for (const name of names) {
        await vaultClient.rotateKeys(name);
      }
      return res.status(StatusCodes.NO_CONTENT).end();
    } catch (e) {
      logger.error(
        { error: e },
        '[process/web/api/user/update-user-keys] An Unexpected error happened',
      );
      return next(e);
    }
  };
}

export default { selfManaged, delegated };
