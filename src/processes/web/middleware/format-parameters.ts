import { NextFunction, Request, Response } from 'express';
import { generateTransactionDetails } from '../../../helpers/generate-transaction-details';
import { logger } from '../../../services/logger';

/**
 * Format
 *
 * @param {Request} req               - the express request object
 * @param {Response} _res             - the express response object
 * @param {NextFunction} next         - the next handler object
 *
 * @return void
 */
export default function formatParametersToTransactionDetails(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  req.body.transactions = [
    generateTransactionDetails(req.path, req.body.parameters),
  ];

  logger.info(
    req.body.transactions,
    '[format-parameters] Generate the transactions details from parameters',
  );

  next();
}
