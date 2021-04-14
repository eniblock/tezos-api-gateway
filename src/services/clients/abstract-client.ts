import { HttpError } from 'http-errors';
import Logger from 'bunyan';

/**
 * Define the client config
 */
export interface ClientConfig {
  apiUrl: string;
}

/**
 * Base client to request external services
 */
export abstract class AbstractClient {
  protected readonly baseUrl: string;
  private _logger: Logger;

  protected constructor(config: ClientConfig, logger: Logger) {
    this.baseUrl = config.apiUrl;
    this._logger = logger;
  }

  public get logger() {
    return this._logger;
  }

  /**
   * Handle error when it get catch
   *
   * @param { HttpError } err   - the http error
   * @param {object} requestDetails - the details related to the request
   */
  protected handleError(err: HttpError, requestDetails: object) {
    if (!err.response) {
      this.logger.error({ err, requestDetails }, 'Network error');
      return;
    }

    if (err.response.status >= 400 && err.response.status < 500) {
      this.logger.error({ err, requestDetails }, 'Client error');
    } else {
      this.logger.info({ err, requestDetails }, 'Server error');
    }
  }
}
