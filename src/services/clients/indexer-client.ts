import Logger from 'bunyan';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import superagent from 'superagent';
import url from 'url';
import { OperationNotFoundError } from '../../const/errors/indexer-error';
import { IndexerConfig } from '../../const/interfaces/indexer-config';
import { TezosService } from '../tezos';
import { AbstractClient } from './abstract-client';

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
    } = this.config;

    this.logger.info(
      {
        operationHash,
        indexerName: name,
      },
      '[services/indexer] Calling the indexer to get the operation status',
    );

    const getOperationUrl = url.resolve(indexerUrl, operationHash);

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
}
