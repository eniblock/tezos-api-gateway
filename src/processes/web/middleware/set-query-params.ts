import { NextFunction, Request, Response } from 'express';

type ReqQuery = { cache: boolean };

/**
 * Set a default value to some query params
 *
 * @param {Request} req               - the express request object
 * @param {Response} _res             - the express response object
 * @param {NextFunction} next         - the next handler object
 *
 * @return void
 */
export default function setQueryParams(
  req: Request<any, any, any, ReqQuery>,
  _res: Response,
  next: NextFunction,
): void {
  if (req.query.cache !== false) req.query.cache = true;

  next();
}
