import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { vaultClientConfig } from '../../../../config';
import { ClientError } from '../../../../const/errors/client-error';
import {
  SendTransactionsParams,
  TransactionDetails,
} from '../../../../const/interfaces/send-transactions-params';
import * as libSendTransaction from '../../../../lib/jobs/send-transactions';
import { AmqpService } from '../../../../services/amqp';
import { logger } from '../../../../services/logger';
import { PostgreService } from '../../../../services/postgre';
import { VaultSigner } from '../../../../services/signers/vault';
import { MetricPrometheusService } from '../../../../services/metric-prometheus';
import { insertJob } from '../../../../models/jobs';
import { JobStatus } from '../../../../const/job-status';
import { GatewayPool } from '../../../../services/gateway-pool';
import {
  InvalidMapStructureParams,
  InvalidParameter,
  InvalidParameterName,
  InvalidVariantObject,
  MissingParameter,
  UnSupportedParameterSchema,
} from '../../../../const/errors/invalid-entry-point-params';
import { OpKind } from '@taquito/rpc';

type ReqQuery = { cache: boolean };

function sendTransactionsAndCreateJobAsync(
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
      const {
        transactions,
        secureKeyName,
        callerId,
      }: SendTransactionsParams = req.body;
      const { cache: useCache } = req.query;

      logger.info(
        { transactions, secureKeyName },
        '[transactions/sendTransactionsAsync] Send the transactions to Tezos',
      );

      const vaultSigner = new VaultSigner(
        vaultClientConfig,
        secureKeyName,
        logger,
      );

      const pkh = await vaultSigner.publicKeyHash();

      logger.info(
        { publicKeyHash: pkh, transactions, secureKeyName },
        '[transactions/sendTransactionsAsync] This account requested to send the transactions to Tezos',
      );

      const job = await libSendTransaction.sendTransactionsAsync(
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
      } else if (
        err instanceof InvalidMapStructureParams ||
        err instanceof InvalidParameterName ||
        err instanceof InvalidParameter ||
        err instanceof MissingParameter ||
        err instanceof UnSupportedParameterSchema ||
        err instanceof InvalidVariantObject
      ) {
        return next(createHttpError(StatusCodes.BAD_REQUEST, err.message));
      }

      return next(err);
    }
  };
}

function sendTransactionsAndCreateJob(
  gatewayPool: GatewayPool,
  postgreClient: PostgreService,
  metricPrometheusService: MetricPrometheusService,
) {
  return async (
    req: Request<any, any, any, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const {
        transactions,
        secureKeyName,
        callerId,
      }: SendTransactionsParams = req.body;
      const { cache: useCache } = req.query;

      logger.info(
        { transactions, secureKeyName },
        '[transactions/sendTransactions] Send the transactions to Tezos',
      );

      const vaultSigner = new VaultSigner(
        vaultClientConfig,
        secureKeyName,
        logger,
      );

      const pkh = await vaultSigner.publicKeyHash();

      logger.info(
        { publicKeyHash: pkh, transactions, secureKeyName },
        '[transactions/sendTransactions] This account requested to send the transactions to Tezos',
      );

      const {
        rows: [insertedJob],
      } = await insertJob(postgreClient.pool, {
        status: JobStatus.CREATED,
        operation_kind: OpKind.TRANSACTION,
      });

      const jobId = insertedJob.id;

      logger.info(
        { insertedJob },
        '[lib/jobs/sendTransactions] Successfully create a job',
      );

      const job = await libSendTransaction.sendTransactions(
        { transactions, secureKeyName, jobId, callerId, useCache },
        gatewayPool,
        postgreClient,
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

export default {
  sendTransactionsAndCreateJobAsync,
  sendTransactionsAndCreateJob,
};
