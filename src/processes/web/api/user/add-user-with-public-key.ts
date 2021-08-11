import { NextFunction, Request, Response } from 'express';
import { AddUserWithPublicKeyParams } from '../../../../const/interfaces/user/add/add-user-with-public-key';
import { logger } from '../../../../services/logger';
import { GatewayPool } from '../../../../services/gateway-pool';
import { StatusCodes } from 'http-status-codes';
import { VaultClient } from '../../../../services/clients/vault-client';
import { vaultClientConfig } from '../../../../config';

function addUserWithPublicKey(gatewayPool: GatewayPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, publicKey }: AddUserWithPublicKeyParams = req.body;

      logger.info(
        { userId, publicKey },
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
        publicKey,
      );

      return res.status(StatusCodes.CREATED).json({ userId, publicKey });
    } catch (err) {
      return next(err);
    }
  };
}

export default { addUserWithPublicKey };
