import * as Logger from 'bunyan';

import { amqpConfig, sendTransactionsWorkerProcessConfig } from './config';
import { PostgreService } from '../../../services/postgre';
import { AmqpService } from '../../../services/amqp';
import { tezosNodeUrls } from '../../../config';
import { createHandler } from './lib/create-handler';
import { AbstractProcess } from '../../abstract-process';
import { SendTransactionsToQueueParams } from '../../../const/interfaces/send-transactions-params';
import { GatewayPool } from '../../../services/gateway-pool';
import { ConfirmChannel } from 'amqplib';
import { Replies } from 'amqplib/properties';

export class SendTransactionsConsumerProcess extends AbstractProcess {
  protected _isRunning: boolean = false;

  protected _postgreService: PostgreService;
  protected _gatewayPool: GatewayPool;
  protected _amqpService: AmqpService;

  constructor(logger: Logger) {
    super(sendTransactionsWorkerProcessConfig, logger);
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

  protected async setWorkerConsumer(
    channel: ConfirmChannel,
  ): Promise<Replies.Consume> {
    const handler = createHandler(
      this.gatewayPool,
      this.postgreService,
      this.logger,
    );
    return this.amqpService.consume<SendTransactionsToQueueParams>(
      channel,
      handler,
      amqpConfig.queues,
    );
  }

  /**
   * Start steps:
   *  - Check if the process is already running
   *  - If not, Start services
   *  - Start injection worker
   */
  public async start(): Promise<boolean> {
    if (this._isRunning) {
      this.logger.info({}, 'Send transactions worker is already running');
      return false;
    }

    await this.postgreService.initializeDatabase();
    await this.amqpService.start(this.setWorkerConsumer, this);

    this.amqpService.schema = {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['contractAddress', 'entryPoint'],
            properties: {
              contractAddress: {
                type: 'string',
                pattern: '^[0-9a-zA-Z]{36}$',
                description: 'An tezos address (contract or account)',
              },
              entryPoint: {
                type: 'string',
                description: "The entry point's name of the contract",
              },
              entryPointParams: {
                oneOf: [
                  { type: 'object' },
                  { type: 'string' },
                  { type: 'number' },
                  { type: 'array' },
                ],
              },
              amount: {
                type: 'integer',
                description:
                  'Amount of Tez (XTZ) transferred in the transaction, in mutez (1 XTZ = 10⁶ mutez)',
              },
              fee: {
                type: 'integer',
                description:
                  'Amount of Tez (XTZ) to pay the transaction gas fee, in mutez (1 XTZ = 10⁶ mutez)',
              },
            },
          },
        },
        secureKeyName: {
          type: 'string',
          description:
            'The key name which contains public key and perform action sign',
        },
      },
    };

    this._isRunning = true;
    this.logger.info('✔ Send transactions worker is running');

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
