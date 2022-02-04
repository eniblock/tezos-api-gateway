import Logger from 'bunyan';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import superagent from 'superagent';
import url from 'url';
import {
  OperationNotFoundError,
  UnsupportedIndexerError,
} from '../../const/errors/indexer-error';
import { IndexerConfig, IndexerEnum } from '../../const/interfaces/indexer';
import { TezosService } from '../tezos';
import { AbstractClient } from './abstract-client';
import { ContractTransactionsParams } from '../../const/interfaces/contract/contract-transactions-params';
import { mapIndexerTransactionToTransaction } from '../../helpers/mappers/transactions-mapper';
import { IndexerTransaction } from '../../const/interfaces/transaction';
import { deleteObjectSubLevel } from '../../helpers/filter-object';

export class IndexerClient extends AbstractClient {
  private _config: IndexerConfig;

  constructor(config: IndexerConfig, logger: Logger) {
    super({ apiUrl: config.apiUrl }, logger);
    this._config = config;
  }

  public get config() {
    return this._config;
  }

  /**
   * Get the operation details
   *
   * @param {string} operationHash   - the operation hash value
   *
   * @return {string} the operation block level
   */
  public async getOperationBlockLevel(operationHash: string) {
    const {
      name,
      apiUrl: indexerUrl,
      keyToOperation,
      keyToBlockLevel,
      pathToOperation,
    } = this.config;

    this.logger.info(
      {
        operationHash,
        indexerName: name,
      },
      '[services/indexer] Calling the indexer to get the operation status',
    );

    const getOperationUrl = url.resolve(
      indexerUrl,
      pathToOperation + operationHash,
    );

    try {
      const { body: result } = await superagent.get(getOperationUrl);

      const operation = result[keyToOperation];

      if (!operation) {
        throw createHttpError(StatusCodes.NOT_FOUND);
      }

      this.logger.info(
        { operation },
        '[IndexerClient/getOperation] Successfully fetched the operation details',
      );

      return operation[keyToBlockLevel];
    } catch (err) {
      if (err.status === StatusCodes.NOT_FOUND) {
        throw new OperationNotFoundError(operationHash);
      }

      this.handleError(err, { operationHash, indexerConfig: this.config });
    }
  }

  /**
   * Check if an operation is confirmed
   *
   * @param {object} tezosService     - the tezos service
   * @param {string} operationHash    - the hash value of the operation
   * @param {number} nbOfConfirmation - the number of confirmation needed
   *
   * @param {boolean} if the operation is confirmed
   */
  public async checkIfOperationIsConfirmed(
    tezosService: TezosService,
    operationHash: string,
    nbOfConfirmation: number,
  ) {
    try {
      const operationBlockLevel = await this.getOperationBlockLevel(
        operationHash,
      );

      if (!operationBlockLevel) {
        return;
      }

      const {
        header: { level: currentBlock },
      } = await tezosService.getLatestBlock();
      return currentBlock - operationBlockLevel >= nbOfConfirmation;
    } catch (err) {
      if (!(err instanceof OperationNotFoundError)) {
        this.logger.error(
          { err },
          '[IndexerClient/checkIfOperationIsConfirmed] Unexpected error happened',
        );
      }

      throw err;
    }
  }

  /**
   * @description       - Call the indexer api to fetch user information
   * @param   {string} - User address
   * @return  {Object}
   * @throw {UserNotFoundError}
   */
  public async getUserInfo(userAddress: string) {
    const {
      name,
      apiUrl: indexerUrl,
      keyToBalance,
      pathToUserInfo,
      keyToReveal,
    } = this.config;

    this.logger.info(
      {
        indexerName: name,
      },
      '[services/indexer] Calling the indexer to get the user info',
    );

    const getUserInfoUrl = url.resolve(
      indexerUrl,
      pathToUserInfo + userAddress,
    );

    try {
      let userInfo;

      const { body: result } = await superagent.get(getUserInfoUrl);

      if ('type' in result && result.type === 'empty') {
        throw createHttpError(StatusCodes.NOT_FOUND);
      }

      userInfo = result;

      this.logger.info(
        { userInfo },
        '[IndexerClient/getUserInfo] Successfully fetched the user information',
      );

      return {
        account: userAddress,
        balance: keyToBalance
          ? userInfo[keyToBalance]
          : userInfo.balance / 1000000,
        revealed: keyToReveal ? userInfo[keyToReveal] : null,
        activated: true,
      };
    } catch (err) {
      if (
        err.status === StatusCodes.NOT_FOUND ||
        err.status === StatusCodes.BAD_REQUEST
      ) {
        return {
          account: userAddress,
          balance: 0,
          revealed: false,
          activated: false,
        };
      }

      this.handleError(err, { userAddress, indexerConfig: this.config });
      return null;
    }
  }

  /**
   * @description                       - Call the indexer api to retrieve a smart contract transaction list
   * @param   {string} contractAddress  - Contract address
   * @param   {Object} params           - the query parameters
   * @return  {Object}
   * @throw {OperationNotFoundError}
   */
  public async getTransactionListOfSC(
    contractAddress: string,
    params: ContractTransactionsParams,
  ): Promise<IndexerTransaction[] | null> {
    const { name: indexerName } = this.config;

    this.logger.info(
      {
        indexerName,
      },
      '[IndexerClient/getTransactionListOfSC] Calling the indexer to get the transaction list',
    );

    // If tzstats isn't specifically targeted, and the randomly selected indexer is Tzstats
    // we increment the offset to remove the origination operation
    if (
      params.indexer !== IndexerEnum.TZSTATS &&
      indexerName === IndexerEnum.TZSTATS
    )
      params.offset = (params.offset || 0) + 1;

    const { domainAndPath, queryParams } = this.buildURLForTransactionList(
      contractAddress,
      params,
    );

    try {
      const { body: result } = await superagent
        .get(domainAndPath)
        .query(queryParams);

      const transactionList = result.map((tx: any) => {
        const transaction = mapIndexerTransactionToTransaction(tx, indexerName);
        if (indexerName === IndexerEnum.TZSTATS) {
          transaction.parameters = {
            ...deleteObjectSubLevel(transaction.parameters, '@or_0'),
          };
        }
        return transaction;
      });

      this.logger.info(
        '[IndexerClient/getTransactionListOfSC] Successfully fetched the transaction list',
      );

      return transactionList;
    } catch (err) {
      if (
        err.status === StatusCodes.NOT_FOUND ||
        err.status === StatusCodes.BAD_REQUEST
      ) {
        throw new OperationNotFoundError(contractAddress);
      }

      this.handleError(err, { contractAddress, indexerConfig: this.config });
      return null;
    }
  }

  /**
   * @description                       - Build the domain, path et query parameters for retrieving transaction list
   *                                      from the configured indexer and params
   * @param   {string} contractAddress  - Contract address
   * @param   {Object} params           - the query parameters
   * @return  {Object}
   * @throw {UnsupportedIndexerError}
   */
  public buildURLForTransactionList(
    contractAddress: string,
    params: ContractTransactionsParams,
  ): { domainAndPath: string; queryParams: string } {
    const {
      name: indexerName,
      apiUrl: indexerUrl,
      pathToContractCalls,
    } = this.config;
    const limit = params.limit || 20;
    const offset = params.offset || 0;

    let domainAndPath = `${indexerUrl}${pathToContractCalls}`;
    let queryParams = `limit=${limit}&offset=${offset}`;

    switch (indexerName) {
      case IndexerEnum.TZSTATS: {
        if (params.parameter !== undefined)
          throw new UnsupportedIndexerError(IndexerEnum.TZSTATS);

        domainAndPath += `${contractAddress}/calls`;
        const order = params.order ? `&order=${params.order}` : '';
        const entrypoint = params.entrypoint
          ? `&entrypoint=${params.entrypoint}`
          : '';
        queryParams += `${order}${entrypoint}`;
        break;
      }
      case IndexerEnum.TZKT: {
        const order = params.order ? `&sort.${params.order}=id` : '';
        const entrypoint = params.entrypoint
          ? `&entrypoint.eq=${params.entrypoint}`
          : '';
        const parameter = params.parameter
          ? `&parameter.as=${params.parameter}`
          : '';
        queryParams += `&target.eq=${contractAddress}${order}${entrypoint}${parameter}`;
        break;
      }
      default:
        throw new UnsupportedIndexerError(indexerName);
    }

    return { domainAndPath, queryParams };
  }
}
