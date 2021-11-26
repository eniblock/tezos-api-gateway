import { NextFunction, Request, Response } from 'express';
import statusCodes from 'http-status-codes';

import { logger } from '../../../services/logger';

type expressMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => Response;

export function errorHandler(): expressMiddleware {
  /**
   * Note: the last argument `next` is important because if its not present, the function
   * will not be called at all.
   */
  /* istanbul ignore next */
  return (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): Response => {
    if (typeof err !== 'object') {
      // If the object is not an Error, create a representation that appears to be
      err = {
        // eslint-disable-line no-param-reassign
        status: statusCodes.INTERNAL_SERVER_ERROR,
        message: String(err), // Coerce to string
      };
    } else {
      // Ensure that err.message is enumerable (It is not by default)
      Object.defineProperty(err, 'message', { enumerable: true });
      Object.defineProperty(err, 'status', {
        enumerable: true,
        value: err.status || statusCodes.INTERNAL_SERVER_ERROR,
      });
    }

    if (err.status === statusCodes.INTERNAL_SERVER_ERROR) {
      logger.error({ err }, '[Express#ErrorHandler] Internal server error');
    }

    const errorBody = {
      message: err.message,
      status: err.status,
    };

    // If we have a server error, then we need to obfuscate its details in the
    // response.
    if (err.status === statusCodes.INTERNAL_SERVER_ERROR) {
      errorBody.message = 'Internal Server Error';
    }

    /* istanbul ignore next */
    return res.status(err.status).json(errorBody);
  };
}
