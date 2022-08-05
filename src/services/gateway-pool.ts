import _ from 'lodash';
import Logger from 'bunyan';

import { generateRandomInt } from '../utils';
import { TezosService } from './tezos';
import superagent from 'superagent';
import url from 'url';

export class GatewayPool {
  private _tezosNodeUrls: string[];
  private _logger: Logger;

  constructor(tezosNodeUrls: string[], logger: Logger) {
    this._tezosNodeUrls = tezosNodeUrls;
    this._logger = logger;
  }

  get tezosNodeUrls(): string[] {
    return this._tezosNodeUrls;
  }

  get logger(): Logger {
    return this._logger;
  }

  async healthCheck(tezosService: TezosService) {
    try {
      const { hash } = await tezosService.getLatestBlock();

      return !_.isEmpty(hash);
    } catch (err) {
      this.logger.error(
        { err },
        '[services/gateway-pool] Error happened while trying to call the tezos node',
      );

      return false;
    }
  }

  public async getTezosService() {
    let tezosUrl = this.getRandomNodeURL();
    let tezosService = new TezosService(tezosUrl);

    while (!(await this.healthCheck(tezosService))) {
      tezosUrl = this.getRandomNodeURL();

      tezosService = new TezosService(tezosUrl);
    }

    return tezosService;
  }

  public getRandomNodeURL(): string {
    const index = generateRandomInt(this.tezosNodeUrls.length);
    return this.tezosNodeUrls[index];
  }

  /**
   * @description         - Get a random indexer then tries to remove an operation from the mempool
   * @param userAddress   - User address
   * @param nbOfRetry     - If a indexer fails the number of retry
   */
  public async removeOperationFromMempool(operationHash: string) {
    try {
      // We exlude smartpy from the possibilities as it doesn't handle baning an operation
      const tezosNodeUrls = this.tezosNodeUrls.filter(
        (nodeUrl) => !nodeUrl.includes('smartpy'),
      );
      const index = generateRandomInt(tezosNodeUrls.length);
      const tezosUrl = tezosNodeUrls[index];

      this.logger.info(
        {
          nodeUrl: tezosUrl,
          operationHash,
        },
        '[GatewayPool/removeOperationFromMempool] Using this node to remove this operation',
      );

      const banOperationUrl = url.resolve(
        tezosUrl,
        '/chains/main/mempool/ban_operation',
      );
      await superagent
        .post(banOperationUrl)
        .send(`"${operationHash}"`)
        .set('Content-Type', 'application/json');
    } catch (err) {
      this.logger.error(
        err,
        '[GatewayPool/removeOperationFromMempool] An unexpected error happened',
      );

      throw err;
    }
  }
}
