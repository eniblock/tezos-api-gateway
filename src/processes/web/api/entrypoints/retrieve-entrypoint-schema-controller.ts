import { NextFunction, Request, Response } from 'express';
import { BAD_REQUEST, OK } from 'http-status-codes';
import createHttpError from 'http-errors';

import { logger } from '../../../../services/logger';
import { GatewayPool } from '../../../../services/gateway-pool';
import { InvalidEntryPoint } from '../../../../const/errors/invalid-entry-point';
import { getEntryPointSchemaFromTezosNode } from '../../../../lib/entrypoints/get-entrypoint-schema';

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

      return res.status(OK).json(result);
    } catch (err) {
      if (err instanceof InvalidEntryPoint) {
        return next(createHttpError(BAD_REQUEST, err.message));
      }

      return next(err);
    }
  };
}

export default {
  retrieveEntryPointsSchemaFromTezosNode,
};
