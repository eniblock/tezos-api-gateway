import { NextFunction, Request, Response } from 'express';

import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { signWithInMemorySigner } from '../../../../lib/test/sign-with-in-memory-signer';
import {
  CheckSignatureParams,
  DataPackingParams,
  InMemorySignerParams,
  VaultSignerParams,
} from '../../../../const/interfaces/test/sign-with-in-memory-signer';
import { signWithVaultKey } from '../../../../lib/test/sign-with-vault-key';
import { pachData } from '../../../../lib/test/pach-data';
import { GatewayPool } from '../../../../services/gateway-pool';
import { checkEd25519Signature } from '../../../../lib/test/check-signature';

export default {
  signInMemory,
  signWithVault,
  packMichelsonData,
  checkSignature,
};

type ReqQuery = { operationPrefix: boolean };

function signInMemory() {
  return async (
    req: Request<any, any, any, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { privateKey, bytesToSign }: InMemorySignerParams = req.body;
      const { operationPrefix } = req.query;
      logger.info(
        '[test/test-controller#signInMemory] Calling in memory signer',
      );

      const { signedOperation, signature } = await signWithInMemorySigner(
        privateKey,
        bytesToSign,
        operationPrefix,
      );

      return res.status(StatusCodes.OK).json({ signedOperation, signature });
    } catch (err) {
      return next(err);
    }
  };
}

function signWithVault() {
  return async (
    req: Request<any, any, any, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { secureKeyName, bytesToSign }: VaultSignerParams = req.body;
      const { operationPrefix } = req.query;
      logger.info('[test/test-controller#signWithVault] Calling vault signer');

      const { signedOperation, signature } = await signWithVaultKey(
        secureKeyName,
        bytesToSign,
        operationPrefix,
      );

      return res.status(StatusCodes.OK).json({ signedOperation, signature });
    } catch (err) {
      return next(err);
    }
  };
}

function checkSignature() {
  return async (
    req: Request<any, any, any, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { signature, publicKey, signedPayload }: CheckSignatureParams =
        req.body;
      const { operationPrefix } = req.query;
      logger.info('[test/test-controller#signWithVault] Calling vault signer');

      const verified = await checkEd25519Signature(
        signature,
        publicKey,
        signedPayload,
        operationPrefix,
      );

      return res.status(StatusCodes.OK).json(verified);
    } catch (err) {
      return next(err);
    }
  };
}

function packMichelsonData(gatewayPool: GatewayPool) {
  return async (
    req: Request<any, any, any, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { data, type }: DataPackingParams = req.body;
      logger.info('[test/test-controller#packMichelsonData] Calling packData');

      const tezosService = await gatewayPool.getTezosService();

      logger.info(
        {
          tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        },
        '[jobs/forge-job-controller] Using this tezos node',
      );

      const packed = await pachData(tezosService, {
        data,
        type,
      });

      return res.status(StatusCodes.OK).json(packed);
    } catch (err) {
      return next(err);
    }
  };
}
