import { NextFunction, Request, Response } from 'express';
import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { VaultClient } from '../../../../services/clients/vault-client';
import { vaultClientConfig } from '../../../../config';

export default {
  createUpdateUserMetadata,
  getUserMetadata,
  deleteUserMetadata,
};

function createUpdateUserMetadata() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = req.params;
      const { data } = req.body;
      logger.info(
        { userId, data },
        '[user/user-metadata-controller/createUpdateUserMetadata] Create or update the following user metadata',
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

function getUserMetadata() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = req.params;
      logger.info(
        { userId },
        '[user/user-metadata-controller/getUserMetadata] Get the user metadata for the following user',
      );

      const vaultClient = new VaultClient(vaultClientConfig, logger);
      const data = await vaultClient.getSecret('metadata', userId, 'metadata');

      return res.status(StatusCodes.OK).json({ data });
    } catch (err) {
      return next(err);
    }
  };
}

function deleteUserMetadata() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = req.params;
      logger.info(
        { userId },
        '[user/user-metadata-controller/deleteUserMetadata] Delete the user metadata for the following user',
      );

      const vaultClient = new VaultClient(vaultClientConfig, logger);
      const data = await vaultClient.deleteSecret('metadata', userId);

      return res.status(StatusCodes.OK).json({ data });
    } catch (err) {
      return next(err);
    }
  };
}
