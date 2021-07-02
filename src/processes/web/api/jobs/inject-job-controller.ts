import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { JobIdNotFoundError } from '../../../../const/errors/job-id-not-found-error';
import { publishToInjectionQueue } from '../../../../lib/amqp/publish-to-injection-queue';
import { selectJobs } from '../../../../models/jobs';
import { AmqpService } from '../../../../services/amqp';
import { logger } from '../../../../services/logger';
import { PostgreService } from '../../../../services/postgre';

function injectOperationAndUpdateJob(
  postgreService: PostgreService,
  amqpService: AmqpService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { jobId, signature, signedTransaction } = req.body;

      logger.info(
        {
          jobId,
          signature,
          signedTransaction,
        },
        '[jobs/patchController] Patch the job and inject the operation to blockchain with the following data',
      );

      const [job] = await selectJobs(postgreService.pool, '*', `id=${jobId}`);

      if (!job) {
        throw new JobIdNotFoundError(
          `Could not find any jobs with this id ${jobId}`,
        );
      }
      publishToInjectionQueue(amqpService, {
        jobId,
        signature,
        signedTransaction,
      });

      return res.status(StatusCodes.OK).json(job);
    } catch (err) {
      if (err instanceof JobIdNotFoundError) {
        return next(createHttpError(StatusCodes.NOT_FOUND, err.message));
      }

      return next(err);
    }
  };
}

export default { injectOperationAndUpdateJob };
