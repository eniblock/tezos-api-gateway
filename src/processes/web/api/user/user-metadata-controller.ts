import { NextFunction, Request, Response } from 'express';
import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { VaultClient } from '../../../../services/clients/vault-client';
import { vaultClientConfig } from '../../../../config';

export default { createUpdateUserMetadata };

function createUpdateUserMetadata() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = req.params;
      const data = req.body;
      logger.info(
        { userId, data },
        '[user/user-metadata-controller/createUpdateUserMetadata] Create or update the following user metadata ',
      );

      const vaultClient = new VaultClient(vaultClientConfig, logger);
      // We check if the user exists
      await vaultClient.getTransitByName(userId);

      await vaultClient.setSecret('metadata', userId, 'metadata', data);

      return res.status(StatusCodes.CREATED).json({ userId, data });
    } catch (err) {
      return next(err);
    }
  };
}
