import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { CREATED } from 'http-status-codes';

import { logger } from '../../../../services/logger';
import { PostgreService } from '../../../../services/postgre';
import { SendTransactionsParams } from '../../../../const/interfaces/send-transactions-params';
import * as libSendTransaction from '../../../../lib/jobs/send-transactions';
import { vaultClientConfig } from '../../../../config';
import { VaultSigner } from '../../../../services/signers/vault';
import { ClientError } from '../../../../const/errors/client-error';
import { AmqpService } from '../../../../services/amqp';

function sendTransactionsAndCreateJob(
  amqpService: AmqpService,
  postgreClient: PostgreService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { transactions, secureKeyName }: SendTransactionsParams = req.body;

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
        { transactions, secureKeyName },
        postgreClient,
        amqpService,
        logger,
      );

      return res.status(CREATED).json(job);
    } catch (err) {
      if (err instanceof ClientError) {
        return next(createHttpError(err.status, err.message));
      }

      return next(err);
    }
  };
}

export default { sendTransactionsAndCreateJob };
