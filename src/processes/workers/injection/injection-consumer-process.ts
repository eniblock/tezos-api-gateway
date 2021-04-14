import * as Logger from 'bunyan';

import { injectionWorkerProcessConfig } from './config';
import { amqpConfig, tezosNodeUrls } from '../../../config';
import { PatchJobParams } from '../../../const/interfaces/patch-job-params';
import { PostgreService } from '../../../services/postgre';
import { AmqpService } from '../../../services/amqp';
import { createHandler } from './lib/create-handler';
import { AbstractProcess } from '../../abstract-process';
import { GatewayPool } from '../../../services/gateway-pool';

export class InjectionConsumerProcess extends AbstractProcess {
  protected _isRunning: boolean = false;

  protected _postgreService: PostgreService;
  protected _gatewayPool: GatewayPool;
  protected _amqpService: AmqpService;

  constructor(logger: Logger) {
    super(injectionWorkerProcessConfig, logger);
    this._postgreService = new PostgreService();
    this._gatewayPool = new GatewayPool(tezosNodeUrls, logger);
    this._amqpService = new AmqpService(amqpConfig, logger);
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  public get postgreService(): PostgreService {
    return this._postgreService;
  }

  public set postgreService(service: PostgreService) {
    this._postgreService = service;
  }

  public get gatewayPool(): GatewayPool {
    return this._gatewayPool;
  }

  public get amqpService() {
    return this._amqpService;
  }

  /**
   * Start steps:
   *  - Check if the process is already running
   *  - If not, Start services
   *  - Start injection worker
   */
  public async start(): Promise<boolean> {
    if (this._isRunning) {
      this.logger.info({}, 'Injection worker is already running');
      return false;
    }

    await this.postgreService.initializeDatabase();
    await this.amqpService.start();

    this.amqpService.schema = {
      type: 'object',
      required: ['jobId', 'signedTransaction', 'signature'],
      properties: {
        jobId: {
          type: 'number',
          description: 'The job id that is going to be patched',
        },
        signedTransaction: {
          type: 'string',
          description: 'the signed transaction',
        },
        signature: {
          type: 'string',
          description: 'the signature used to sign',
        },
      },
    };

    const handler = createHandler(this.gatewayPool, this.postgreService);
    this.amqpService.consume<PatchJobParams>(handler);

    this._isRunning = true;
    this.logger.info('✔ Injection worker is running');

    return true;
  }

  /**
   * Stop steps:
   *  - Check if the process is running
   *  - If it is, stop services
   */
  public async stop(): Promise<boolean> {
    if (!this.isRunning) {
      return false;
    }

    await this.postgreService.disconnect();
    await this.amqpService.stop();

    this._isRunning = false;

    return true;
  }
}
