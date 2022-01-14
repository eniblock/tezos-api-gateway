import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import Ajv, { ValidateFunction } from 'ajv';
import Logger from 'bunyan';

import { MessageValidationSchema } from '../const/interfaces/message-validation-schema';
import { MissingMessageValidationSchemaError } from '../const/errors/missing-message-validation-schema-error';
import { ExchangeType } from '../const/exchange-type';
import { Options, Replies } from 'amqplib/properties';
import * as amqpConMan from 'amqp-connection-manager';

export interface AmqpConfig {
  url: string;
  queues?: string;
  exchange?: {
    name: string;
    type: ExchangeType;
  };
  routingKey?: string;
}

export class AmqpService {
  private _connection!: amqpConMan.AmqpConnectionManager;
  private _channel!: amqpConMan.ChannelWrapper;

  private readonly _config: AmqpConfig;
  private _schema: MessageValidationSchema | undefined;
  private _logger: Logger;

  constructor(config: AmqpConfig, logger: Logger) {
    this._config = config;
    this._logger = logger;
  }

  public get connection() {
    return this._connection;
  }

  public get channel() {
    return this._channel;
  }

  public get config() {
    return this._config;
  }

  public get schema(): MessageValidationSchema | undefined {
    return this._schema;
  }

  /**
   * Set the schema to validate the message when the service consume the msg
   *
   * @param schema
   */
  public set schema(schema: MessageValidationSchema | undefined) {
    this._schema = schema;
  }

  /**
   * Connect to the broker and start the amqp channel
   */
  public async start(
    consumer?: (channel: ConfirmChannel) => Promise<Replies.Consume>,
    context?: any,
  ): Promise<boolean> {
    try {
      this._connection = await amqpConMan.connect(this._config.url);

      this._channel = this._connection.createChannel({
        json: true,
        setup: (channel: ConfirmChannel) => {
          const assertQueuePromisesArray: Promise<Replies.AssertQueue>[] = [];
          if (this.config.queues) {
            const queues = this.config.queues.split(' ');
            for (const q of queues) {
              assertQueuePromisesArray.push(
                channel.assertQueue(q, {
                  durable: true,
                }),
              );
            }
          }
          let assertExchangePromise;
          if (this.config.exchange) {
            const { name, type } = this.config.exchange;

            assertExchangePromise = channel.assertExchange(name, type, {
              durable: true,
            });
          }
          const prefetchChannel = channel.prefetch(1);

          return Promise.all([
            assertQueuePromisesArray,
            assertExchangePromise,
            prefetchChannel,
            consumer?.apply(context, [channel]),
          ]);
        },
      });
      await this.channel.waitForConnect();
    } catch (error) {
      this._logger.error('[AmqpService/start] An unexpected error occurred');
      throw error;
    }

    return true;
  }

  /**
   * Stop the amqp connection
   */
  public async stop(): Promise<boolean> {
    try {
      if (this._connection) {
        await this.connection.close();
      }
    } catch (error) {
      this._logger.error('[AmqpService/stop] An unexpected error occurred');
      throw error;
    }

    return true;
  }

  /**
   * Send the message to a queue
   *
   * @param {object} params  - the object which will be formatted to json string
   * @param {string} queue   - the target queue
   */
  public async sendToQueue<T>(params: T, queue: string) {
    await this.channel.sendToQueue(queue, params, { persistent: true });
  }

  /**
   * Publish the message to a certain exchange
   *
   * @param {string} exchange      - the exchange name
   * @param {string} routingKey    - the routing key
   * @param {object} params        - the message to be sent
   * @param {object} options       - the publishing options
   */
  public async publishMessage<T>(
    exchange: string,
    routingKey: string,
    params: T,
    options: Options.Publish = {},
  ) {
    const finalOptions = { ...options, persistent: true };

    this._logger.info(
      { exchange, routingKey, finalOptions },
      '[AmqpService/publishMessage] Publish with options',
    );

    return this.channel.publish(exchange, routingKey, params, finalOptions);
  }

  /**
   * Listen to the message in queue, validate the message format then treat the message
   *
   * @param {object} channel    - the channel used by the consumer
   * @param {function} handler  - the function to treat the message
   * @param {string} queueName  - the name of the queue
   */
  public async consume<T>(
    channel: ConfirmChannel,
    handler: (params: T) => Promise<void>,
    queueName?: string,
  ) {
    if (!queueName) {
      const { routingKey, exchange } = this._config;
      const queue = await channel.assertQueue('', { exclusive: true });
      queueName = queue.queue;

      routingKey
        ? await channel.bindQueue(queueName, exchange!.name, routingKey)
        : await channel.bindQueue(queueName, exchange!.name, '#');
    }

    return channel.consume(queueName, (msg) => {
      this.messageHandler(msg, handler);
    });
  }

  /**
   * Validate the message when consume
   *
   * @param {object} message - the object that will be sent to the queue
   */
  public validateMessage<T>(message: T) {
    if (!this._schema) {
      throw new MissingMessageValidationSchemaError();
    }
    const messageValidationFn: ValidateFunction = new Ajv().compile(
      this._schema,
    );

    if (messageValidationFn(message)) return message;

    this._logger.error(
      { schema: this._schema, message },
      '[AmqpService/validateMessage] Could not validate this message',
    );
    return null;
  }

  /**
   * Handle the message when the queue receive ones
   * First check if the message match the schema
   * Then do the required action
   *
   * @param {object} msg       - the message in the queue
   * @param {function} handler - the function to handle message after it is validated
   *
   * @return {Promise<void>}
   */
  public async messageHandler<T>(
    msg: ConsumeMessage | null,
    handler: (params: T) => Promise<void>,
  ) {
    if (!msg) return;

    const messageContent: T = JSON.parse(msg.content.toString());

    this._logger.info(
      { message: messageContent },
      '[AmqpService] Consume message',
    );

    let validatedMessage: T | null;

    try {
      validatedMessage = this.validateMessage<T>(messageContent);

      if (!validatedMessage) {
        return this.channel.ack(msg);
      }
    } catch (err) {
      this._logger.error(
        { err },
        '[AmqpService] Unexpected error happens during message validation',
      );

      return this.channel.ack(msg);
    }

    try {
      await handler(validatedMessage);
    } catch (err) {
      this._logger.error(
        { err },
        '[AmqpService] Unexpected error happens during message handling',
      );
    }

    this.channel.ack(msg);
  }
}
