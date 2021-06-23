import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { vaultClientConfig } from '../../../../config';
import { ClientError } from '../../../../const/errors/client-error';
import { SendTransactionsParams } from '../../../../const/interfaces/send-transactions-params';
import * as libSendTransaction from '../../../../lib/jobs/send-transactions';
import { AmqpService } from '../../../../services/amqp';
import { logger } from '../../../../services/logger';
import { PostgreService } from '../../../../services/postgre';
import { VaultSigner } from '../../../../services/signers/vault';

function sendTransactionsAndCreateJob(
  amqpService: AmqpService,
  postgreClient: PostgreService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { transactions, secureKeyName, callerId }: SendTransactionsParams =
        req.body;

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

      const job = await libSendTransaction.sendTransactionsToQueue(
        { transactions, secureKeyName, callerId },
        postgreClient,
        amqpService,
        logger,
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
