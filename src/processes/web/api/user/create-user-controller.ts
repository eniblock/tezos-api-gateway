import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createAccounts } from '../../../../lib/user/create-account';
import { GatewayPool } from '../../../../services/gateway-pool';
import { logger } from '../../../../services/logger';
import { CreateUserParams } from '../../../../const/interfaces/user/create/create-user-params';

function createUser(gatewayPool: GatewayPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Declaration of request parameters
      const { userIdList, secureKeyName }: CreateUserParams = req.body;
      logger.info(
        {
          userIdList,
          secureKeyName,
        },
        '[user/create-user-controller] User creation with the following data',
      );

      const tezosService = await gatewayPool.getTezosService();

      logger.info(
        {
          tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        },
        '[user/create-user-controller] Using this tezos node',
      );

      const result = await createAccounts(userIdList, secureKeyName,tezosService);

      return res.status(StatusCodes.CREATED).json(result);
    } catch (err) {
      return next(err);
    }
  };
}

export default { createUser };
