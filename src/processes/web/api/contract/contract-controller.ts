import { NextFunction, Request, Response } from 'express';

import { logger } from '../../../../services/logger';
import { StatusCodes } from 'http-status-codes';
import { IndexerPool } from '../../../../services/indexer-pool';
import { ContractTransactionsParams } from '../../../../const/interfaces/contract/contract-transactions-params';
import { IndexerEnum } from '../../../../const/interfaces/indexer';
import {
  OperationNotFoundError,
  UnsupportedIndexerError,
} from '../../../../const/errors/indexer-error';

export default { getTransactionListOfSC };

/**
 * @description                  - Get a random indexer then retrieve the transaction list of a contract
 *                                 If the query param 'parameter' is set we set TZKT as the indexer
 *                                 as it's the only one that can handle the parameter
 * @param  {object} indexerPool  - The indexer pool
 * @return {object[]}            - The transaction list filtered and paginated
 * @throw {OperationNotFoundError || UnsupportedIndexerError}
 */
function getTransactionListOfSC(indexerPool: IndexerPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contract_address: contractAddress } = req.params;
      const params: ContractTransactionsParams = req.query;

      logger.info(
        { contractAddress },
        '[contract/contract-controller] Requesting transactions made on this contract ',
      );

      const currentIndexer =
        params.parameter === undefined
          ? indexerPool.getRandomIndexer()
          : indexerPool.getSpecificIndexer(IndexerEnum.TZKT);

      const transactionList = await currentIndexer.getTransactionListOfSC(
        contractAddress,
        params,
      );

      return res.status(StatusCodes.OK).json(transactionList);
    } catch (err) {
      if (!(err instanceof OperationNotFoundError || UnsupportedIndexerError)) {
        logger.error(
          err,
          '[user/contract-controller/getTransactionListOfSC] An unexpected error happened',
        );
      }

      return next(err);
    }
  };
}
