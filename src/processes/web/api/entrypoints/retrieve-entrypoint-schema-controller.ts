import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { InvalidEntryPoint } from '../../../../const/errors/invalid-entry-point';
import { getEntryPointSchemaFromTezosNode } from '../../../../lib/entrypoints/get-entrypoint-schema';
import { GatewayPool } from '../../../../services/gateway-pool';
import { logger } from '../../../../services/logger';

function retrieveEntryPointsSchemaFromTezosNode(gatewayPool: GatewayPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contract_address: contractAddress } = req.params;
      const { entryPoints } = req.query;

      logger.info(
        {
          contractAddress,
          entryPoints,
        },
        '[entrypoints/retrieve-entrypoint-schema-controller] Going to retrieve the entry ' +
          'points schema of this contract',
      );

      const tezosService = await gatewayPool.getTezosService();

      const result = await getEntryPointSchemaFromTezosNode(
        logger,
        tezosService,
        contractAddress,
        entryPoints as string[] | undefined,
      );

      return res.status(StatusCodes.OK).json(result);
    } catch (err) {
      if (err instanceof InvalidEntryPoint) {
        return next(createHttpError(StatusCodes.BAD_REQUEST, err.message));
      }

      return next(err);
    }
  };
}

export default {
  retrieveEntryPointsSchemaFromTezosNode,
};
