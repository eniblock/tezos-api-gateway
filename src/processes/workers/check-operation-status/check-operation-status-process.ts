import Logger from 'bunyan';

import { AbstractProcess } from '../../abstract-process';
import { PostgreService } from '../../../services/postgre';
import { tezosNodeUrls } from '../../../config';
import { amqpConfig, checkOperationStatusProcess, cronTime } from './config';
import { GatewayPool } from '../../../services/gateway-pool';
import { IndexerPool } from '../../../services/indexer-pool';
import { checkOperationStatus } from './lib/check-operation-status';
import { AmqpService } from '../../../services/amqp';
import * as cron from 'cron';

export class CheckOperationStatusProcess extends AbstractProcess {
  private _cronJob: cron.CronJob | undefined;
  protected _isRunning: boolean = false;

  protected _postgreService: PostgreService;
  protected _gatewayPool: GatewayPool;
  protected _amqpService: AmqpService;
  protected _indexerPool: IndexerPool;

  constructor(logger: Logger) {
    super(checkOperationStatusProcess, logger);
    this._postgreService = new PostgreService();
    this._gatewayPool = new GatewayPool(tezosNodeUrls, logger);
    this._amqpService = new AmqpService(amqpConfig, logger);
    this._indexerPool = new IndexerPool(logger);
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

  public get amqpService() {
    return this._amqpService;
  }

  public set amqpService(service) {
    this._amqpService = service;
  }

  public get indexerPool(): IndexerPool {
    return this._indexerPool;
  }

  public get gatewayPool(): GatewayPool {
    return this._gatewayPool;
  }

  public get cronJob(): cron.CronJob | undefined {
    return this._cronJob;
  }

  public set cronJob(cronJob: cron.CronJob | undefined) {
    this._cronJob = cronJob;
  }

  /**
   * Start steps:
   *  - Check if the process is already running
   *  - If not, Start services
   *  - Start checkOperationStatus worker
   */
  public async start(): Promise<boolean> {
    if (this._isRunning) {
      this.logger.info('Check operation status worker is already running');
      return false;
    }

    this._isRunning = true;
    this.logger.info('✔ Check operation status worker is starting');
    await this.indexerPool.initializeIndexers();
    await this.amqpService.start();

    const tezosService = await this.gatewayPool.getTezosService();

    this.logger.info(
      {
        tezosNode: tezosService.tezos.rpc.getRpcUrl(),
      },
      'Using this tezos node',
    );

    await checkOperationStatus(
      {
        postgreService: this.postgreService,
        tezosService,
        amqpService: this.amqpService,
        indexerPool: this.indexerPool,
      },
      this.logger,
    );

    this.cronJob = new cron.CronJob(cronTime, async () => {
      await checkOperationStatus(
        {
          postgreService: this.postgreService,
          tezosService,
          amqpService: this.amqpService,
          indexerPool: this.indexerPool,
        },
        this.logger,
      );
    });

    this.cronJob.start();

    this.logger.info('✔ Check operation status worker started successfully');
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

    if (this.cronJob) this.cronJob.stop();
    await this.postgreService.disconnect();
    await this.amqpService.stop();

    this._isRunning = false;

    return true;
  }
}
