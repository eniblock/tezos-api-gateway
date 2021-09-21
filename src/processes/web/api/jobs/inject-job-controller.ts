import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { OK, StatusCodes } from 'http-status-codes';

import { logger } from '../../../../services/logger';
import { JobIdNotFoundError } from '../../../../const/errors/job-id-not-found-error';
import { AmqpService } from '../../../../services/amqp';
import { sendToInjectionQueue } from '../../../../lib/amqp/send-to-injection-queue';
import { PostgreService } from '../../../../services/postgre';
import { selectJobs } from '../../../../models/jobs';
import { GatewayPool } from '../../../../services/gateway-pool';
import { injectOperation } from '../../../../lib/jobs/inject-operation';

function injectOperationAndUpdateJob(
  postgreService: PostgreService,
  gatewayPool: GatewayPool,
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

      await injectOperation(
        { gatewayPool, postgreService },
        {
          jobId,
          signature,
          signedTransaction,
        },
      );

      return res.status(OK).json(job);
    } catch (err) {
      if (err instanceof JobIdNotFoundError) {
        return next(createHttpError(StatusCodes.NOT_FOUND, err.message));
      }

      return next(err);
    }
  };
}

function injectOperationAndUpdateJobAsync(
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
        '[jobs/patchController] Patch the job and inject the operation asynchronously to blockchain with the following data',
      );

      const [job] = await selectJobs(postgreService.pool, '*', `id=${jobId}`);

      if (!job) {
        throw new JobIdNotFoundError(
          `Could not find any jobs with this id ${jobId}`,
        );
      }

      sendToInjectionQueue(amqpService, {
        jobId,
        signature,
        signedTransaction,
      });

      return res.status(OK).json(job);
    } catch (err) {
      if (err instanceof JobIdNotFoundError) {
        return next(createHttpError(StatusCodes.NOT_FOUND, err.message));
      }

      return next(err);
    }
  };
}

export default {
  injectOperationAndUpdateJob,
  injectOperationAndUpdateJobAsync,
};
