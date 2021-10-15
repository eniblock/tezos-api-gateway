import { NextFunction, Request, Response } from 'express';

import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { IndexerPool } from '../../../../services/indexer-pool';
import { ContractTransactionsParams } from '../../../../const/interfaces/contract/contract-transactions-params';

export default { getTransactionListOfSC };

function getTransactionListOfSC(indexerPool: IndexerPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contract_address: contractAddress } = req.params;
      const params: ContractTransactionsParams = req.query;

      logger.info(
        { contractAddress },
        '[user/contract-controller] Requesting transactions made on this contract ',
      );

      const transactionList = await indexerPool.getTransactionListOfSCByRandomIndexer(
        contractAddress,
        params,
      );

      return res.status(StatusCodes.OK).json(transactionList);
    } catch (err) {
      return next(err);
    }
  };
}
