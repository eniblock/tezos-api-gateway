import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { CREATED } from 'http-status-codes';

import { logger } from '../../../../services/logger';
import { PostgreService } from '../../../../services/postgre';
import * as libSendTransaction from '../../../../lib/jobs/send-transactions';
import { vaultClientConfig } from '../../../../config';
import { VaultSigner } from '../../../../services/signers/vault';
import { ClientError } from '../../../../const/errors/client-error';
import { AmqpService } from '../../../../services/amqp';
import { generateTransactionDetails } from '../../../../helpers/generate-transactions';

function sendTransactionsAndCreateJob(
  amqpService: AmqpService,
  postgreClient: PostgreService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { parameters, secureKeyName } = req.body;

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
