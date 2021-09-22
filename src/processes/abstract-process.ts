import Timeout = NodeJS.Timeout;
import Logger from 'bunyan';
import { AmqpConfig, AmqpService } from '../services/amqp';

export interface ProcessConfig {
  exitTimeout: number;
  name: string;
}

type ProcessDestroySignal =
  | 'SIGTERM'
  | 'SIGINT'
  | 'uncaughtException'
  | 'unhandledRejection';

export function signalHandler(
  process: AbstractProcess,
  signal: ProcessDestroySignal,
): () => Promise<Timeout> {
  return () => {
    return process.destroy(signal);
  };
}

export function errorHandler(
  process: AbstractProcess,
  signal: ProcessDestroySignal,
): (err: Error) => Promise<Timeout> {
  return (err) => {
    return process.destroy(signal, err);
  };
}

/**
 *
 * The basic concept around building an application is a "layer" architecture,
 * where each one handles their own logic & data.
 *
 */
export abstract class AbstractProcess {
  // The constructor is protected to avoid instantiating `AbstractProcess` directly
  protected constructor(
    public readonly config: ProcessConfig,
    private readonly _logger: Logger,
  ) {}

  public get name(): string {
    return this.config.name;
  }
  public get exitTimeout(): number {
    return this.config.exitTimeout;
  }

  public get logger(): Logger {
    return this._logger;
  }

  /* These are the methods concrete classes need to implement, to handle their lifecycle */
  public abstract start(): Promise<boolean>;
  public abstract stop(): Promise<boolean>;

  /**
   * Bind the process to exit event handlers, then start.
   * When start fails, stop the process after a timeout.
   */
  public async spawn(): Promise<boolean> {
    this.logger.info({ config: this.config }, `[spawn] Starting process`);

    this.bindProcess();

    try {
      await this.start();
      return true;
    } catch (err) {
      this.logger.fatal(
        { err, config: this.config },
        `[spawn] Fatal error, process will crash`,
      );

      // Effort to shut down the application properly before exiting the process
      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, this.exitTimeout)),
        this.destroy('SIGINT', err),
      ]);

      process.exit(1);
    }
    return false;
  }

  /**
   * Cleanup and stop the process properly, then exit the process.
   * @param signal - Signal to stop the process with
   * @param err - Error that caused the destruction of the process
   */
  public async destroy(
    signal: ProcessDestroySignal,
    err?: Error,
  ): Promise<Timeout> {
    const log = this.logger.child({ signal, runnerName: this.name });

    if (err) {
      log.error({ err }, '[destroy] Application error');
    }
    log.info({ err }, '[destroy] Stopping application');

    return this.stop()
      .then(() => {
        log.info({ err }, '[destroy] Application stopped');
        return setTimeout(() => process.exit(err ? 1 : 0), this.exitTimeout);
      })
      .catch((stopErr) => {
        log.error(
          { err: stopErr, firstErr: err },
          '[destroy] Application crashed',
        );

        return setTimeout(() => process.exit(1), this.exitTimeout);
      });
  }

  protected abstract setWorkerConsumer(): void;

  protected bindProcess(): void {
    process.once('SIGTERM', signalHandler(this, 'SIGTERM'));
    process.once('SIGINT', signalHandler(this, 'SIGINT'));
    process.once('uncaughtException', errorHandler(this, 'uncaughtException'));
  }

  public async startRabbitMQ(amqpService: AmqpService, amqpConfig: AmqpConfig) {
    await amqpService.start();
    const queues = amqpConfig.queues!.split(' ');
    for (const q of queues) {
      await amqpService.channel.assertQueue(q, {
        durable: true,
      });
    }

    if (amqpConfig.exchange) {
      const { name, type } = amqpConfig.exchange;

      await amqpService.channel.assertExchange(name, type, {
        durable: true,
      });
    }

    amqpService.connection.on('close', async () => {
      if (amqpService.isCloseIntended) return;
      this.logger.error(
        {},
        '[AmqpService] Connection was closed, reconnecting...',
      );
      await this.startRabbitMQ(amqpService, amqpConfig);
    });

    await this.setWorkerConsumer();
  }
}
