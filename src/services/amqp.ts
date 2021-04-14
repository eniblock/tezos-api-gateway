import amqp, { ConsumeMessage } from 'amqplib';
import Ajv, { ValidateFunction } from 'ajv';
import Logger from 'bunyan';

import { MessageValidationSchema } from '../const/interfaces/message-validation-schema';
import { MissingMessageValidationSchemaError } from '../const/errors/missing-message-validation-schema-error';
import { ExchangeType } from '../const/exchange-type';
import { Options } from 'amqplib/properties';

export interface AmqpConfig {
  url: string;
  queueName?: string;
  exchange?: {
    name: string;
    type: ExchangeType;
  };
  routingKey?: string;
}

export class AmqpService {
  private _connection: amqp.Connection | undefined;
  private _channel: amqp.Channel | undefined;

  private _config: AmqpConfig;
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
   * Create the amqp channel
   */
  public async createChannel() {
    this._connection = await amqp.connect(this._config.url);

    this._channel = await this.connection!.createChannel();

    await this.channel!.prefetch(1);
  }

  /**
   * Start the amqp channel
   */
  public async start(): Promise<boolean> {
    try {
      await this.createChannel();

      this.channel!.prefetch(1);

      if (this._config.queueName) {
        await this.channel!.assertQueue(this._config.queueName, {
          durable: true,
        });
      }

      if (this._config.exchange) {
        const { name, type } = this._config.exchange;

        await this.channel!.assertExchange(name, type, {
          durable: true,
        });
      }
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
        await this.connection!.close();
      }
    } catch (error) {
      throw error;
    }

    return true;
  }

  /**
   * Send the message the the queue
   *
   * @param {object} params  - the object which will be formatted to json string
   */
  public sendToQueue<T>(params: T) {
    if (!this._config.queueName) {
      throw new Error('Queue name is not set');
    }

    return this.channel?.sendToQueue(
      this._config.queueName,
      Buffer.from(JSON.stringify(params)),
      { persistent: true },
    );
  }

  /**
   * Publish the message to an certain exchange
   *
   * @param {string} exchange      - the exchange name
   * @param {string} routingKey    - the routing key
   * @param {object} params        - the message to be sent
   */
  public publishMessage<T>(
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

    return this.channel!.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(params)),
      finalOptions,
    );
  }

  /**
   * Listen to the message in queue, validate the message format then treat the message
   *
   * @param {function} handler  - the function to treat the message
   */
  public async consume<T>(handler: (params: T) => Promise<void>) {
    const { queueName, routingKey, exchange } = this._config;
    if (!queueName && !exchange) {
      throw new Error('Either queue name or exchange key must be set');
    }

    if (!queueName) {
      const queue = await this.channel!.assertQueue('', { exclusive: true });

      this._config.queueName = queue.queue;
      routingKey
        ? this.channel?.bindQueue(
            this._config.queueName,
            exchange!.name,
            routingKey,
          )
        : this.channel?.bindQueue(this._config.queueName, exchange!.name, '#');
    }

    return this.channel?.consume(this._config.queueName!, (msg) => {
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
        return this.channel!.ack(msg);
      }
    } catch (err) {
      this._logger.error(
        { err },
        '[AmqpService] Unexpected error happens during message validation',
      );

      return this.channel!.ack(msg);
    }

    try {
      await handler(validatedMessage as T);
    } catch (err) {
      this._logger.error(
        { err },
        '[AmqpService] Unexpected error happens during message handling',
      );
    }

    this.channel!.ack(msg);
  }
}
