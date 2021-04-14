import _ from 'lodash';
import Logger from 'bunyan';

import { generateRandomInt } from '../utils';
import { TezosService } from './tezos';

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
    let index = generateRandomInt(this.tezosNodeUrls.length);
    let tezosUrl = this.tezosNodeUrls[index];
    let tezosService = new TezosService(tezosUrl);

    while (!(await this.healthCheck(tezosService))) {
      index = generateRandomInt(this.tezosNodeUrls.length);
      tezosUrl = this.tezosNodeUrls[index];

      tezosService = new TezosService(tezosUrl);
    }

    return tezosService;
  }
}
