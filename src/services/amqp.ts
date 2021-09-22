import amqp, { ConsumeMessage } from 'amqplib';
import Ajv, { ValidateFunction } from 'ajv';
import Logger from 'bunyan';

import { MessageValidationSchema } from '../const/interfaces/message-validation-schema';
import { MissingMessageValidationSchemaError } from '../const/errors/missing-message-validation-schema-error';
import { ExchangeType } from '../const/exchange-type';
import { Options } from 'amqplib/properties';

export interface AmqpConfig {
  url: string;
  queues?: string;
  exchange?: {
    name: string;
    type: ExchangeType;
  };
  reconnectTimeoutInMs?: number;
  routingKey?: string;
}
type PublishParam<H> = {
  exchange: string;
  routingKey: string;
  params: H;
  options: Options.Publish;
};

type SendToQueueParam<H> = {
  params: H;
  queueName: string;
};

export class AmqpService<H = {}> {
  private _connection!: amqp.Connection;
  private _channel!: amqp.Channel;
  private _offlinePubQueue: PublishParam<H>[];
  private _offlineSendToQueue: SendToQueueParam<H>[];
  private _isCloseIntended: boolean;

  private _config: AmqpConfig;
  private _schema: MessageValidationSchema | undefined;
  private _logger: Logger;

  constructor(config: AmqpConfig, logger: Logger) {
    this._config = config;
    this._logger = logger;
    this._offlinePubQueue = [];
    this._offlineSendToQueue = [];
    this._isCloseIntended = false;
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

  public get isCloseIntended() {
    return this._isCloseIntended;
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
   * Connect to the RabbitMQ server
   */
  public async connect() {
    await new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        try {
          this._connection = await amqp.connect(this._config.url);
          this._channel = await this.connection.createChannel();
          await this.channel!.prefetch(1);
          this._logger.info({}, '[AmqpService] Connected');

          clearInterval(interval);
          resolve();
        } catch (err) {
          this._logger.error(
            { err },
            '[AmqpService] Connection error, retrying...',
          );
        }
      }, this._config.reconnectTimeoutInMs);
    });
  }

  /**
   * Connect to the broker and start the amqp channel
   */
  public async start(): Promise<boolean> {
    try {
      await this.connect();

      // We set a timeout to make sure that the workers had time to connect to the broker
      setTimeout(async () => {
        await this.unstackOfflinesQueues();
      }, this._config.reconnectTimeoutInMs);
    } catch (error) {
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
        this._isCloseIntended = true;
        await this.connection.close();
      }
    } catch (error) {
      throw error;
    }

    return true;
  }

  /**
   * Send the message to a queue
   * If the sending fails, we push to message to an offline queue
   *
   * @param {object} params  - the object which will be formatted to json string
   * @param {string} queue   - the target queue
   */
  public sendToQueue(params: H, queue: string) {
    try {
      return this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(params)),
        { persistent: true },
      );
    } catch (err) {
      this._logger.error(
        { err },
        '[AmqpService] An unexpected error happened during sendToQueue, publishing to the offline sendToQueue',
      );
      this._offlineSendToQueue.push({ params, queueName: queue });
      return true;
    }
  }

  /**
   * Publish the message to a certain exchange
   * If the publish fails, we push to message to an offline queue
   *
   * @param {string} exchange      - the exchange name
   * @param {string} routingKey    - the routing key
   * @param {object} params        - the message to be sent
   * @param {object} options       - the publishing options
   */
  public async publishMessage(
    exchange: string,
    routingKey: string,
    params: H,
    options: Options.Publish = {},
  ) {
    const finalOptions = { ...options, persistent: true };

    this._logger.info(
      { exchange, routingKey, finalOptions },
      '[AmqpService/publishMessage] Publish with options',
    );

    try {
      return this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(params)),
        finalOptions,
      );
    } catch (err) {
      this._logger.error(
        { err },
        '[AmqpService] An unexpected error happened during publish, publishing to the offline publish queue',
      );
      this._offlinePubQueue.push({
        exchange,
        routingKey,
        params,
        options: finalOptions,
      });
      return true;
    }
  }

  /**
   * Listen to the message in queue, validate the message format then treat the message
   *
   * @param {function} handler  - the function to treat the message
   */
  public async consume<T>(
    handler: (params: T) => Promise<void>,
    queueName?: string,
  ) {
    if (!queueName) {
      const { routingKey, exchange } = this._config;
      const queue = await this.channel!.assertQueue('', { exclusive: true });
      queueName = queue.queue;

      routingKey
        ? await this.channel?.bindQueue(queueName, exchange!.name, routingKey)
        : await this.channel?.bindQueue(queueName, exchange!.name, '#');
    }

    return this.channel.consume(queueName, (msg) => {
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
      await handler(validatedMessage as T);
    } catch (err) {
      this._logger.error(
        { err },
        '[AmqpService] Unexpected error happens during message handling',
      );
    }

    this.channel.ack(msg);
  }

  /**
   * Resend all the messages stacked in offline queues
   * As the condition of a for loop is reevaluated on each iteration and the queues can be mutated,
   * we must first store the array's length to avoid an infinite loop
   */
  public async unstackOfflinesQueues() {
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0, length = this._offlinePubQueue.length; i < length; i++) {
      const m = this._offlinePubQueue.shift();
      if (m)
        await this.publishMessage(
          m.exchange,
          m.routingKey,
          m.params,
          m.options,
        );
    }

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0, length = this._offlineSendToQueue.length; i < length; i++) {
      const m = this._offlineSendToQueue.shift();
      if (m) this.sendToQueue(m.params, m.queueName);
    }
  }
}
