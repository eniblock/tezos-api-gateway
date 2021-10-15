import Logger from 'bunyan';

import { IndexerClient } from './clients/indexer-client';
import { indexerConfigs } from '../config';
import { generateRandomInt } from '../utils';
import {
  OperationNotFoundError,
  UnsupportedIndexerError,
  UserNotFoundError,
} from '../const/errors/indexer-error';
import { TezosService } from './tezos';
import { ContractTransactionsParams } from '../const/interfaces/contract/contract-transactions-params';
import { IndexerTransaction } from '../const/interfaces/transaction';

export class IndexerPool {
  private _indexers: IndexerClient[];
  private _logger: Logger;

  constructor(logger: Logger) {
    this._indexers = [];
    this._logger = logger;
  }

  public get indexers() {
    return this._indexers;
  }

  public get logger() {
    return this._logger;
  }

  /**
   * Add the list of indexers to the indexer pool
   */
  public async initializeIndexers() {
    await Promise.all(
      indexerConfigs.map((indexerConfig) =>
        this.indexers.push(new IndexerClient(indexerConfig, this.logger)),
      ),
    );
  }

  public getRandomIndexer() {
    return this.indexers[generateRandomInt(this.indexers.length)];
  }

  /**
   * Get the operation block level by calling randomly the indexer
   *
   * @param {string} operationHash  - the hash value of the operation
   * @param {number} nbOfRetry      - the number of retry
   */
  public async getOperationBlockLevelByRandomIndexer(
    operationHash: string,
    nbOfRetry: number,
  ) {
    let currentIndexer: IndexerClient;
    while (nbOfRetry > 0) {
      try {
        currentIndexer = this.getRandomIndexer();

        this.logger.info(
          {
            currentIndexer: currentIndexer.config.name,
          },
          '[IndexerPool/getOperationBlockLevelByRandomIndexer] Using this indexer to get the operation block level',
        );

        const blockLevel = await currentIndexer.getOperationBlockLevel(
          operationHash,
        );

        if (!blockLevel) {
          nbOfRetry--;
          continue;
        }

        return blockLevel;
      } catch (err) {
        if (!(err instanceof OperationNotFoundError)) {
          this.logger.error(
            {
              err,
            },
            '[IndexerPool/getOperationByRandomIndexer] Unexpect error happened',
          );
        }

        throw err;
      }
    }
  }

  /**
   * Check if the operation is confirmed by calling randomly the indexer
   *
   * @param {string} operationHash  - the hash value of the operation
   * @param {number} nbOfRetry      - the number of retry
   */
  public async checkIfOperationIsConfirmedByRandomIndexer(
    tezosService: TezosService,
    {
      operationHash,
      nbOfConfirmation,
    }: {
      operationHash: string;
      nbOfConfirmation: number;
    },
    nbOfRetry: number,
  ): Promise<boolean | undefined> {
    let currentIndexer: IndexerClient;
    while (nbOfRetry > 0) {
      try {
        currentIndexer = this.getRandomIndexer();

        this.logger.info(
          {
            currentIndexer: currentIndexer.config.name,
            operationHash,
            nbOfConfirmation,
          },
          '[IndexerPool/checkIfOperationIsConfirmedByRandomIndexer] Using this indexer to check if the operation is confirmed',
        );

        const isConfirmed = await currentIndexer.checkIfOperationIsConfirmed(
          tezosService,
          operationHash,
          nbOfConfirmation,
        );

        if (typeof isConfirmed === 'boolean') {
          return isConfirmed;
        }

        nbOfRetry--;
      } catch (err) {
        if (!(err instanceof OperationNotFoundError)) {
          this.logger.error(
            {
              err,
            },
            '[IndexerPool/checkIfOperationIsConfirmedByRandomIndexer] Unexpect error happened',
          );
        }

        throw err;
      }
    }
    return;
  }

  /**
   * @description         - Get a random indexer then tries to fetch user info via getUserInfo
   * @param userAddress   - User address
   * @param nbOfRetry     - If a indexer fails the number of retry
   */
  public async getUserInfoByRandomIndexer(
    userAddress: string,
    nbOfRetry: number,
  ) {
    let currentIndexer: IndexerClient;

    while (nbOfRetry > 0) {
      try {
        currentIndexer = this.getRandomIndexer();

        this.logger.info(
          {
            currentIndexer: currentIndexer.config.name,
          },
          '[IndexerPool/getUserInfoByRandomIndexer] Using this indexer to get the user information',
        );

        const userInfo = await currentIndexer.getUserInfo(userAddress);

        if (!userInfo) {
          nbOfRetry--;
          continue;
        }

        return userInfo;
      } catch (err) {
        if (!(err instanceof UserNotFoundError)) {
          this.logger.error(
            err,
            '[IndexerPool/getUserInfoByRandomIndexer] An unexpected error happened',
          );
          nbOfRetry--;
          continue;
        }

        throw err;
      }
    }
    return null;
  }

  /**
   * @description                      - Get a random indexer then retrieve the transaction list of a contract
   * @param {string} contractAddress   - Contract address
   * @param {object} params            - Query params
   */
  public async getTransactionListOfSCByRandomIndexer(
    contractAddress: string,
    params: ContractTransactionsParams,
  ): Promise<IndexerTransaction[] | null> {
    let currentIndexer: IndexerClient;

    try {
      currentIndexer = this.getRandomIndexer();

      this.logger.info(
        {
          currentIndexer: currentIndexer.config.name,
        },
        '[IndexerPool/getTransactionListOfSCByRandomIndexer] Using this indexer to get the user information',
      );

      const transactionList = await currentIndexer.getTransactionListOfSC(
        contractAddress,
        params,
      );

      return transactionList;
    } catch (err) {
      if (!(err instanceof OperationNotFoundError || UnsupportedIndexerError)) {
        this.logger.error(
          err,
          '[IndexerPool/getTransactionListOfSCByRandomIndexer] An unexpected error happened',
        );
      }

      throw err;
    }
    return null;
  }
}
