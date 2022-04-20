import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { ClientError } from '../../../../const/errors/client-error';
import { JobIdNotFoundError } from '../../../../const/errors/job-id-not-found-error';
import { selectJobs } from '../../../../models/jobs';
import { logger } from '../../../../services/logger';
import { PostgreService } from '../../../../services/postgre';
import { selectOperation } from '../../../../models/operations';
import _ from 'lodash';

function getJobById(postgreService: PostgreService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[job/getJobById] Get job informations by ID');

      // Checking if params is not null and is a number
      if (
        req.params &&
        req.params.id &&
        typeof req.params.id === 'string' &&
        !isNaN(Number(req.params.id))
      ) {
        // Save the ID passed in request param
        const JOB_ID = Number(req.params.id);

        // Get the corresponding job in DB
        const [job] = await selectJobs(
          postgreService.pool,
          '*',
          `id=${JOB_ID}`,
        );

        if (!job) {
          // If job id couldn't be found
          throw new JobIdNotFoundError(
            `Could not find job with this id: ${JOB_ID}`,
          );
        }

        return res.status(StatusCodes.OK).json(job);
      } else {
        return next(
          createHttpError(StatusCodes.BAD_REQUEST, 'Bad query params'),
        );
      }
    } catch (err) {
      if (err instanceof JobIdNotFoundError) {
        return next(createHttpError(StatusCodes.NOT_FOUND, err.message));
      } else if (err instanceof ClientError) {
        return next(createHttpError(err.status, err.message));
      }
      return next(err);
    }
  };
}

function getJobsByCallerId(postgreService: PostgreService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('[job/getJobsByCallerId] Get jobs by caller ID');

      // Checking if params is not null
      if (req.params && req.params.callerId) {
        // Save the ID passed in request param
        const callerId = req.params.callerId;

        // Get the corresponding job identifiers in DB
        const jobIds = await selectOperation(
          postgreService.pool,
          'job_id',
          `caller_id='${callerId}'`,
        );

        if (_.isEmpty(jobIds)) {
          // If job id couldn't be found
          throw new JobIdNotFoundError(
            `Could not find jobs for this caller id: ${callerId}`,
          );
        }

        // Get the corresponding job in DB
        const jobs = await Promise.all(
          jobIds.map(async ({ job_id }) => {
            const [job] = await selectJobs(
              postgreService.pool,
              '*',
              `id=${job_id}`,
            );
            if (!job) {
              throw new JobIdNotFoundError(
                `Could not find job with this id: ${job_id}`,
              );
            }
            return job;
          }),
        );

        return res.status(StatusCodes.OK).json(jobs);
      } else {
        return next(
          createHttpError(StatusCodes.BAD_REQUEST, 'Bad query params'),
        );
      }
    } catch (err) {
      if (err instanceof JobIdNotFoundError) {
        return next(createHttpError(StatusCodes.NOT_FOUND, err.message));
      } else if (err instanceof ClientError) {
        return next(createHttpError(err.status, err.message));
      }
      return next(err);
    }
  };
}

export default { getJobById, getJobsByCallerId };
