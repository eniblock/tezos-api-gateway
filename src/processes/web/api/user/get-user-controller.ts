import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../../../services/logger';
import { getUserAccounts } from '../../../../lib/user/get-user-account';

function getUser() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Declaration of request parameters
      const { userIdList: users } = req.query;
      logger.info(
        {
          users,
        },
        '[user/get-user-controller] Get accounts for the following users',
      );

      const accounts = await getUserAccounts(users as string[]);

      return res.status(StatusCodes.OK).json(accounts);
    } catch (err) {
      return next(err);
    }
  };
}

export default { getUser };
