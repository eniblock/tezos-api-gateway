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
  InvalidBooleanParameter,
  InvalidMapStructureParams,
  InvalidParameter,
  InvalidParameterName,
  InvalidVariantObject,
  MissingParameter,
  UnSupportedParameterSchema,
} from '../../../../const/errors/invalid-entry-point-params';
import { OpKind } from '@taquito/rpc';
import {
  TezosOperationError,
  TezosPreapplyFailureError,
} from '@taquito/taquito';
import {
  AddressValidationError,
  BigMapValidationError,
  BytesValidationError,
  ChainIDValidationError,
  ContractValidationError,
  IntValidationError,
  KeyHashValidationError,
  KeyValidationError,
  ListValidationError,
  MapValidationError,
  MutezValidationError,
  NatValidationError,
  SetValidationError,
  SignatureValidationError,
} from '@taquito/michelson-encoder';

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
      const { transactions, secureKeyName, callerId }: SendTransactionsParams =
        req.body;
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

      addTransactionsToMetric(metricPrometheusService, transactions);

      return res.status(StatusCodes.CREATED).json(job);
    } catch (err) {
      if (err instanceof ClientError) {
        return next(createHttpError(err.status, err.message));
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
      const { transactions, secureKeyName, callerId }: SendTransactionsParams =
        req.body;
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

      addTransactionsToMetric(metricPrometheusService, transactions);

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
        err instanceof InvalidVariantObject ||
        err instanceof InvalidBooleanParameter ||
        err instanceof ListValidationError ||
        err instanceof MapValidationError ||
        err instanceof SetValidationError ||
        err instanceof BigMapValidationError ||
        err instanceof ChainIDValidationError ||
        err instanceof KeyValidationError ||
        err instanceof ContractValidationError ||
        err instanceof SignatureValidationError ||
        err instanceof AddressValidationError ||
        err instanceof BytesValidationError ||
        err instanceof IntValidationError ||
        err instanceof KeyHashValidationError ||
        err instanceof MutezValidationError ||
        err instanceof NatValidationError ||
        err instanceof TezosOperationError ||
        err instanceof TezosPreapplyFailureError
      ) {
        return next(createHttpError(StatusCodes.BAD_REQUEST, err.message));
      }

      return next(err);
    }
  };
}

function addTransactionsToMetric(
  metricPrometheusService: MetricPrometheusService,
  transactions: TransactionDetails[],
): void {
  transactions.forEach(
    ({ contractAddress, entryPoint }: TransactionDetails) => {
      metricPrometheusService.entryPointCounter.add(1, {
        [contractAddress]: entryPoint,
      });
    },
  );
}

export default {
  sendTransactionsAndCreateJobAsync,
  sendTransactionsAndCreateJob,
};
