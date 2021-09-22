import amqp from 'amqplib';

import { logger } from '../../__fixtures__/services/logger';
import { amqpConfig } from '../../__fixtures__/config';

import { AmqpService } from '../../../src/services/amqp';
import { MissingMessageValidationSchemaError } from '../../../src/const/errors/missing-message-validation-schema-error';
import { ExchangeType } from '../../../src/const/exchange-type';

describe('[services/amqp] Amqp Service', () => {
  type message = {
    message: string;
  };

  const testMessage: message = { message: 'this is a test' };

  const amqpService: AmqpService = new AmqpService(amqpConfig, logger);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#connect', () => {
    afterEach(async () => {
      await amqpService.stop();
    });

    it('should connect to broker and create the channel', async () => {
      const amqpSpy = jest.spyOn(amqp, 'connect');
      await amqpService.connect();

      expect(amqpService.connection).not.toBeUndefined();
      expect(amqpService.channel).not.toBeUndefined();
      expect(amqpSpy.mock.calls).toEqual([[amqpConfig.url]]);
    });
  });

  describe('#start', () => {
    let connectSpy: jest.SpyInstance;

    beforeEach(async () => {
      await amqpService.connect();
      connectSpy = jest.spyOn(amqpService, 'connect');
    });

    afterEach(async () => {
      await amqpService.stop();
    });

    it('should properly start the service', async () => {
      connectSpy.mockImplementation();

      await amqpService.start();
      expect(connectSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw when unexpected error happen', async () => {
      connectSpy.mockRejectedValue(new Error('Unexpected Error'));

      await expect(amqpService.start()).rejects.toThrow(
        Error('Unexpected Error'),
      );

      expect(connectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('#stop', () => {
    it('should do nothing if the connection is undefined', async () => {
      const notStartedAmqpService = new AmqpService(amqpConfig, logger);
      await expect(notStartedAmqpService.stop()).resolves.toEqual(true);
    });

    it('should properly stop the service', async () => {
      await amqpService.start();
      const connectionSpy = jest.spyOn(amqpService.connection!, 'close');

      await expect(amqpService.stop()).resolves.toEqual(true);

      expect(connectionSpy.mock.calls).toEqual([[]]);
    });

    it('should throw when unexpected error happen', async () => {
      await amqpService.start();
      const connectionSpy = jest
        .spyOn(amqpService.connection!, 'close')
        .mockRejectedValueOnce(new Error('Unexpected Error'));

      await expect(amqpService.stop()).rejects.toThrowError(
        Error('Unexpected Error'),
      );

      expect(connectionSpy.mock.calls).toEqual([[]]);

      await amqpService.connection!.close();
    });
  });

  describe('#sendToQueue', () => {
    beforeEach(async () => {
      await amqpService.start();
    });

    afterEach(async () => {
      await amqpService.stop();
    });

    it('should correct send message to the queue', async () => {
      const channelSpy = jest
        .spyOn(amqpService.channel!, 'sendToQueue')
        .mockImplementation();

      amqpService.sendToQueue(testMessage, 'send-transaction');

      expect(channelSpy.mock.calls).toEqual([
        [
          'send-transaction',
          Buffer.from(JSON.stringify({ message: 'this is a test' })),
          { persistent: true },
        ],
      ]);
    });
  });

  describe('#consume', () => {
    const handler = (_params: string) => {
      return Promise.resolve();
    };

    describe('When queue name is not defined', () => {
      const configWithoutRoutingKey = {
        url: amqpConfig.url,
        exchange: { name: 'topic_logs', type: ExchangeType.topic },
        reconnectTimeoutInMs: 3000,
      };
      const noQueueNameAmqpService = new AmqpService(
        configWithoutRoutingKey,
        logger,
      );

      it('should throw an error when channel is not defined', async () => {
        await expect(noQueueNameAmqpService.consume(handler)).rejects.toThrow(
          Error("Cannot read property 'assertQueue' of undefined"),
        );
      });

      it('should correctly call assertQueue without routingKey', async () => {
        await noQueueNameAmqpService.start();
        const { name, type } = configWithoutRoutingKey.exchange;
        await noQueueNameAmqpService.channel.assertExchange(name, type, {
          durable: true,
        });

        const consumeSpy = jest
          .spyOn(noQueueNameAmqpService.channel as amqp.Channel, 'consume')
          .mockImplementation();
        const bindQueueSpy = jest.spyOn(
          noQueueNameAmqpService.channel as amqp.Channel,
          'bindQueue',
        );

        await expect(noQueueNameAmqpService.consume(handler)).resolves.toEqual(
          undefined,
        );

        expect(consumeSpy).toHaveBeenCalledTimes(1);
        expect(bindQueueSpy).toHaveBeenCalledTimes(1);

        await noQueueNameAmqpService.stop();
      });

      it('should correctly call assertQueue with routingKey', async () => {
        const configWithRoutingKey = {
          url: amqpConfig.url,
          reconnectTimeoutInMs: 3000,
          exchange: { name: 'direct_logs', type: ExchangeType.direct },
          routingKey: 'routing',
        };
        const noQueueNameWithRoutingKeyAmqpService = new AmqpService(
          configWithRoutingKey,
          logger,
        );

        await noQueueNameWithRoutingKeyAmqpService.start();
        const { name, type } = configWithRoutingKey.exchange;
        await noQueueNameWithRoutingKeyAmqpService.channel.assertExchange(
          name,
          type,
          {
            durable: true,
          },
        );

        const consumeSpy = jest
          .spyOn(
            noQueueNameWithRoutingKeyAmqpService.channel as amqp.Channel,
            'consume',
          )
          .mockImplementation();
        const bindQueueSpy = jest.spyOn(
          noQueueNameWithRoutingKeyAmqpService.channel as amqp.Channel,
          'bindQueue',
        );

        await expect(
          noQueueNameWithRoutingKeyAmqpService.consume(handler),
        ).resolves.toEqual(undefined);

        expect(consumeSpy).toHaveBeenCalledTimes(1);
        expect(bindQueueSpy).toHaveBeenCalledTimes(1);

        await noQueueNameWithRoutingKeyAmqpService.stop();
      });
    });
  });

  describe('#validateMessage', () => {
    it('should throw MissingMessageValidationSchemaError when the schema is not set', () => {
      expect(() =>
        amqpService.validateMessage<message>(testMessage),
      ).toThrowError(MissingMessageValidationSchemaError);
    });

    describe('when the schema is set', () => {
      beforeEach(() => {
        amqpService.schema = {
          type: 'object',
          required: ['message'],
          properties: {
            message: {
              type: 'string',
            },
          },
        };
      });

      it('should return null when the message does not match the schema', () => {
        expect(
          amqpService.validateMessage<message>(({
            message: 12,
          } as unknown) as message),
        ).toBeNull();
      });

      it('should return the message if the validation passed', () => {
        expect(amqpService.validateMessage<message>(testMessage)).toEqual({
          message: 'this is a test',
        });
      });
    });
  });
});
