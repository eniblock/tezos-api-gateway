import { GatewayPool } from '../../../../services/gateway-pool';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { packData } from '../../../../lib/utils/pack-data';
import { DataPackingParams } from '../../../../const/interfaces/utils/pack-data';
import { InvalidMapStructureParams } from '../../../../const/errors/invalid-entry-point-params';
import createHttpError from 'http-errors';
import { AddressValidationError } from '@taquito/michelson-encoder';
import { checkTezosSignature } from '../../../../lib/utils/check-signature';
import { CheckSignatureParams } from '../../../../const/interfaces/utils/check-signature';

export default {
  packMichelsonData,
  checkSignature,
};

type ReqQuery = { operationPrefix: boolean };

function packMichelsonData(gatewayPool: GatewayPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, type }: DataPackingParams = req.body;
      logger.info(
        { data, type },
        '[utils/utils-controller#packMichelsonData] Calling packData',
      );

      const tezosService = await gatewayPool.getTezosService();

      logger.info(
        {
          tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        },
        '[utils/utils-controller#packMichelsonData] Using this tezos node',
      );

      const packedData = await packData(tezosService, {
        data,
        type,
      });

      return res.status(StatusCodes.OK).json({ packedData });
    } catch (err) {
      if (
        err instanceof InvalidMapStructureParams ||
        err instanceof AddressValidationError
      ) {
        return next(createHttpError(StatusCodes.BAD_REQUEST, err.message));
      }
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
      const { signature, publicKey, hexData }: CheckSignatureParams = req.body;
      const { operationPrefix } = req.query;
      logger.info(
        { signature, publicKey, hexData, operationPrefix },
        '[utils/utils-controller#checkSignature] Calling checkTezosSignature',
      );

      const result = await checkTezosSignature(
        signature,
        publicKey,
        hexData,
        operationPrefix,
      );

      return res.status(StatusCodes.OK).json({ result });
    } catch (err) {
      return next(err);
    }
  };
}
