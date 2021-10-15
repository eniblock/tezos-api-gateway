import Logger from 'bunyan';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import superagent from 'superagent';
import url from 'url';
import {
  OperationNotFoundError,
  UnsupportedIndexerError,
  UserNotFoundError,
} from '../../const/errors/indexer-error';
import { IndexerConfig, IndexerEnum } from '../../const/interfaces/indexer';
import { TezosService } from '../tezos';
import { AbstractClient } from './abstract-client';
import { ContractTransactionsParams } from '../../const/interfaces/contract/contract-transactions-params';
import { mapIndexerTransactionToTransaction } from '../../const/mappers/transactions-mapper';
import { IndexerTransaction } from '../../const/interfaces/transaction';

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
      apiKey,
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
      const { body: result } = apiKey
        ? await superagent
            .get(getOperationUrl)
            .set({ apikey: this.config.apiKey })
        : await superagent.get(getOperationUrl);

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
      apiKey,
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
    let getUserInfoUrlConseil = url.resolve(indexerUrl, pathToUserInfo);

    try {
      let userInfo;

      if (apiKey) {
        getUserInfoUrlConseil =
          getUserInfoUrlConseil[getUserInfoUrlConseil.length - 1] === '/'
            ? getUserInfoUrlConseil.substring(
                0,
                getUserInfoUrlConseil.length - 1,
              )
            : getUserInfoUrlConseil;
        const { body: result } = await superagent
          .post(getUserInfoUrlConseil)
          .set({ apiKey })
          .send({
            predicates: [
              {
                field: 'account_id',
                operation: 'eq',
                set: [userAddress],
              },
            ],
            output: 'json',
            limit: 1,
          });

        if (Array.isArray(result) && result.length === 0) {
          throw createHttpError(StatusCodes.NOT_FOUND);
        }

        userInfo = result[0];
      } else {
        const { body: result } = await superagent.get(getUserInfoUrl);

        if ('type' in result && result.type === 'empty') {
          throw createHttpError(StatusCodes.NOT_FOUND);
        }

        userInfo = result;
      }

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
      };
    } catch (err) {
      if (
        err.status === StatusCodes.NOT_FOUND ||
        err.status === StatusCodes.BAD_REQUEST
      ) {
        throw new UserNotFoundError(userAddress);
      }

      this.handleError(err, { userAddress, indexerConfig: this.config });
      return null;
    }
  }

  /**
   * @description       - Call the indexer api to retrieve a smart contract transaction list
   * @param   string    - Contract address
   * @return  {Object}
   * @throw {OperationNotFoundError}
   */
  public async getTransactionListOfSC(
    contractAddress: string,
    params: ContractTransactionsParams,
  ): Promise<IndexerTransaction[] | null> {
    const {
      name: indexerName,
      apiUrl: indexerUrl,
      pathToContractCalls,
    } = this.config;

    this.logger.info(
      {
        indexerName,
      },
      '[IndexerClient/getTransactionListOfSC] Calling the indexer to get the transaction list',
    );

    let getContractTransactionListUrl = `${indexerUrl}${pathToContractCalls}`;
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    let queryParams = `limit=${limit}&offset=${offset}`;

    switch (indexerName) {
      case IndexerEnum.TZSTATS: {
        getContractTransactionListUrl += `${contractAddress}/calls`;
        const order = params.order ? `order=${params.order}` : '';
        const entrypoint = params.entrypoint
          ? `entrypoint=${params.entrypoint}`
          : '';
        queryParams += `&${order}&${entrypoint}`;
        break;
      }
      case IndexerEnum.TZKT: {
        const order = params.order ? `sort.${params.order}=id` : '';
        const entrypoint = params.entrypoint
          ? `entrypoint.eq=${params.entrypoint}`
          : '';
        queryParams += `&target.eq=${contractAddress}&${order}&${entrypoint}`;
        break;
      }
      default:
        throw new UnsupportedIndexerError(indexerName);
        break;
    }

    try {
      const { body: result } = await superagent
        .get(getContractTransactionListUrl)
        .query(queryParams);

      const transactionList = result.map((tx: any) =>
        mapIndexerTransactionToTransaction(tx, indexerName),
      );

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
}
