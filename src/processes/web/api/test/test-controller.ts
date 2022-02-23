import { NextFunction, Request, Response } from 'express';

import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { signWithInMemorySigner } from '../../../../lib/test/sign-with-in-memory-signer';
import { InMemorySignerParams } from '../../../../const/interfaces/test/sign-with-in-memory-signer';

export default { sign };

type ReqQuery = { operationPrefix: boolean };

function sign() {
  return async (
    req: Request<any, any, any, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { privateKey, forgedOperation }: InMemorySignerParams = req.body;
      const { operationPrefix } = req.query;
      logger.info('[test/test-controller#sign] Calling in memory signer');

      const { signedOperation, signature } = await signWithInMemorySigner(
        privateKey,
        forgedOperation,
        operationPrefix,
      );

      return res.status(StatusCodes.OK).json({ signedOperation, signature });
    } catch (err) {
      return next(err);
    }
  };
}
