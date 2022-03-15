import { NextFunction, Request, Response } from 'express';
import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { vaultClientConfig } from '../../../../config';
import { GatewayPool } from '../../../../services/gateway-pool';
import { PostgreService } from '../../../../services/postgre';
import { TransferTokensParams } from '../../../../const/interfaces/user/transfer/transfer-tokens';
import { VaultSigner } from '../../../../services/signers/vault';
import { insertJob } from '../../../../models/jobs';
import { JobStatus } from '../../../../const/job-status';
import { OpKind } from '@taquito/rpc';
import { sendTransferTransactions } from '../../../../lib/jobs/send-transfer-transactions';

export default {
  transferTokens,
};

type ReqQuery = { operationPrefix: boolean };

function transferTokens(
  gatewayPool: GatewayPool,
  postgreClient: PostgreService,
) {
  return async (
    req: Request<any, any, any, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { transactions, callerId }: TransferTokensParams = req.body;
      const { userId } = req.params;
      logger.info(
        { userId, transactions },
        '[user/user-transfer-controller#transferTokens] Transferring Tezos tokens',
      );

      const vaultSigner = new VaultSigner(vaultClientConfig, userId, logger);

      const pkh = await vaultSigner.publicKeyHash();

      logger.info(
        { publicKeyHash: pkh, userId, transactions },
        '[user/user-transfer-controller#transferTokens] This account requested to send the transfer transactions to Tezos',
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
        '[user/user-transfer-controller#transferTokens] Successfully create a job',
      );

      const job = await sendTransferTransactions(
        { transactions, vaultSigner, jobId, callerId },
        gatewayPool,
        postgreClient,
        logger,
      );

      return res.status(StatusCodes.CREATED).json(job);
    } catch (err) {
      return next(err);
    }
  };
}
