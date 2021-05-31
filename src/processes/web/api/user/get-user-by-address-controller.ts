import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../../../services/logger';
import { getUserByAddress } from '../../../../lib/user/get-user-by-address';

function getUser() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Declaration of request parameters
      const { userAddressList: addresses } = req.query;
      logger.info(
        {
          users: addresses,
        },
        '[user/get-user-controller] Get users for the following accounts',
      );

      const users = await getUserByAddress(addresses as string[]);

      return res.status(StatusCodes.OK).json(users);
    } catch (err) {
      return next(err);
    }
  };
}

export default { getUser };
