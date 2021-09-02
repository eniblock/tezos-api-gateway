import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { vaultClientConfig } from '../../../../config';
import { ClientError } from '../../../../const/errors/client-error';
import { generateTransactionDetails } from '../../../../helpers/generate-transactions';
import * as libSendTransaction from '../../../../lib/jobs/send-transactions';
import { AmqpService } from '../../../../services/amqp';
import { logger } from '../../../../services/logger';
import { PostgreService } from '../../../../services/postgre';
import { VaultSigner } from '../../../../services/signers/vault';
import { TransactionDetails } from '../../../../const/interfaces/send-transactions-params';
import { MetricPrometheusService } from '../../../../services/metric-prometheus';

type ReqQuery = { useCache: boolean };

function sendTransactionsAndCreateJob(
  amqpService: AmqpService,
  postgreClient: PostgreService,
  metricPrometheusService: MetricPrometheusService,
) {
  return async (
    req: Request<any, any, any, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { parameters, secureKeyName, callerId } = req.body;
      const { useCache } = req.query;

      logger.info(
        { parameters, secureKeyName },
        '[send-job-controller] Send the transactions to Tezos',
      );

      const transactions = [generateTransactionDetails(req.path, parameters)];

      logger.info(
        {
          transactions,
        },
        '[send-job-controller] Generate the transactions details from parameters',
      );

      const vaultSigner = new VaultSigner(
        vaultClientConfig,
        secureKeyName,
        logger,
      );

      const pkh = await vaultSigner.publicKeyHash();

      logger.info(
        { publicKeyHash: pkh, transactions, secureKeyName },
        '[send-job-controller] This account requested to send the transactions to Tezos',
      );

      const job = await libSendTransaction.sendTransactionsToQueue(
        { transactions, secureKeyName, callerId, useCache },
        postgreClient,
        amqpService,
        logger,
      );

      transactions.forEach(
        ({ contractAddress, entryPoint }: TransactionDetails) => {
          metricPrometheusService.entryPointCounter.add(1, {
            [contractAddress]: entryPoint,
          });
        },
      );

      return res.status(StatusCodes.CREATED).json(job);
    } catch (err) {
      if (err instanceof ClientError) {
        return next(createHttpError(err.status, err.message));
      }

      return next(err);
    }
  };
}

export default { sendTransactionsAndCreateJob };
