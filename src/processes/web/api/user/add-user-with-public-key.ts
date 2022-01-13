import { NextFunction, Request, Response } from 'express';
import { addUserWithPublicKeyHashParams } from '../../../../const/interfaces/user/add/add-user-with-public-key';
import { logger } from '../../../../services/logger';
import { GatewayPool } from '../../../../services/gateway-pool';
import { StatusCodes } from 'http-status-codes';
import { VaultClient } from '../../../../services/clients/vault-client';
import { vaultClientConfig } from '../../../../config';

function addUserWithPublicKeyHash(gatewayPool: GatewayPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        userId,
        publicKeyHash,
      }: addUserWithPublicKeyHashParams = req.body;

      logger.info(
        { userId, publicKeyHash },
        '[user/add-user-by-public-key] Adding user with the following data',
      );

      const tezosService = await gatewayPool.getTezosService();

      logger.info(
        {
          tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        },
        '[user/add-user-by-public-key] Using this tezos node',
      );

      const vaultClient = new VaultClient(vaultClientConfig, logger);
      await vaultClient.setSecret(
        'self-managed',
        userId,
        'publicKey',
        publicKeyHash,
      );

      return res.status(StatusCodes.CREATED).json({ userId, publicKeyHash });
    } catch (err) {
      return next(err);
    }
  };
}

export default { addUserWithPublicKeyHash };
