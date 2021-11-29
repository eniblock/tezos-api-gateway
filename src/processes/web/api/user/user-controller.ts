import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../../../services/logger';
import {
  getSelfManagedUserAccounts,
  getUserAccounts,
} from '../../../../lib/user/get-user-account';

export default { getUser };

function getUser() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Declaration of request parameters
      const { userIdList: users, isDelegated } = req.query;
      logger.info(
        {
          users,
          isDelegated,
        },
        '[user/user-controller#getUser] Get accounts for the following users',
      );

      let accounts;
      accounts = isDelegated
        ? await getUserAccounts(users as string[])
        : await getSelfManagedUserAccounts(users as string[]);

      return res.status(StatusCodes.OK).json(accounts);
    } catch (err) {
      return next(err);
    }
  };
}
