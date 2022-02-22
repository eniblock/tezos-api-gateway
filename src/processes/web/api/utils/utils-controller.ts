import { GatewayPool } from '../../../../services/gateway-pool';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { packData } from '../../../../lib/utils/pack-data';
import { DataPackingParams } from '../../../../const/interfaces/utils/pack-data';

export default {
  packMichelsonData,
};

function packMichelsonData(gatewayPool: GatewayPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, type }: DataPackingParams = req.body;
      logger.info(
        '[utils/utils-controller#packMichelsonData] Calling packData',
      );

      const tezosService = await gatewayPool.getTezosService();

      logger.info(
        {
          tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        },
        '[utils/utils-controller] Using this tezos node',
      );

      const packedData = await packData(tezosService, {
        data,
        type,
      });

      return res.status(StatusCodes.OK).json({ packedData });
    } catch (err) {
      return next(err);
    }
  };
}
