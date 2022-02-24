import { NextFunction, Request, Response } from 'express';
import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { signData } from '../../../../lib/user/sign-data';
import {
  SignDataParams,
  SignDataResult,
} from '../../../../const/interfaces/user/sign/sign-data';
import { VaultClient } from '../../../../services/clients/vault-client';
import { vaultClientConfig } from '../../../../config';

export default {
  signDataWithUserWallet,
};

type ReqQuery = { operationPrefix: boolean };

function signDataWithUserWallet() {
  return async (
    req: Request<any, any, any, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { bytesToSign }: SignDataParams = req.body;
      const { userId } = req.params;
      const { operationPrefix }: ReqQuery = req.query;
      logger.info('[test/test-controller#signWithVault] Calling vault signer');

      // We check if the user exists
      const vaultClient = new VaultClient(vaultClientConfig, logger);
      await vaultClient.getTransitByName(userId);

      const { signedData, signature }: SignDataResult = await signData(
        userId,
        bytesToSign,
        operationPrefix,
      );

      return res.status(StatusCodes.OK).json({ signedData, signature });
    } catch (err) {
      return next(err);
    }
  };
}
