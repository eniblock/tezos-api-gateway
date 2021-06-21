import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { ClientError } from '../../../../const/errors/client-error';
import { selectJobs } from '../../../../models/jobs';
import { logger } from '../../../../services/logger';
import { PostgreService } from '../../../../services/postgre';

function getJobById(
  postgreService: PostgreService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Save the ID passed in request param
      const ID = req.params;

      // Get the corresponding job in DB
      const [job] = await selectJobs(postgreService.pool, 'id', `id=${ID}`);

      logger.info(
        '[job/getJobById] Get job informations by ID',
      );

      return res.status(StatusCodes.OK).json(job);
    } catch (err) {
      if (err instanceof ClientError) {
        return next(createHttpError(err.status, err.message));
      }
      return next(err);
    }
  };
}

export default { getJobById };
