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

  describe('#createChannel', () => {
    afterEach(async () => {
      await amqpService.stop();
    });

    it('should correct create the channel', async () => {
      const amqpSpy = jest.spyOn(amqp, 'connect');

      await amqpService.createChannel();

      expect(amqpService.connection).not.toBeUndefined();
      expect(amqpService.channel).not.toBeUndefined();

      expect(amqpSpy.mock.calls).toEqual([[amqpConfig.url]]);
    });
  });

  describe('#start', () => {
    let createChannelSpy: jest.SpyInstance;

    beforeEach(async () => {
      await amqpService.createChannel();
      createChannelSpy = jest.spyOn(amqpService, 'createChannel');
    });

    afterEach(async () => {
      await amqpService.stop();
    });

    it('should properly start the service, call assertQueue without calling assertExchange when exchange is not defined', async () => {
      createChannelSpy.mockImplementation();

      const assertQueueSpy = jest.spyOn(
        amqpService.channel as amqp.Channel,
        'assertQueue',
      );
      const assertExchangeSpy = jest.spyOn(
        amqpService.channel as amqp.Channel,
        'assertExchange',
      );

      await expect(amqpService.start()).resolves.toEqual(true);

      expect(createChannelSpy).toHaveBeenCalledTimes(1);
      expect(assertExchangeSpy).toHaveBeenCalledTimes(0);
      expect(assertQueueSpy.mock.calls).toEqual([['test', { durable: true }]]);
    });

    it('should properly start the service, call assertQueue and also assertExchange when exchange is defined', async () => {
      const amqpServiceWithExchange = new AmqpService(
        {
          ...amqpConfig,
          exchange: { name: 'topic_logs', type: ExchangeType.topic },
        },
        logger,
      );

      await amqpServiceWithExchange.createChannel();

      const assertQueueSpy = jest.spyOn(
        amqpServiceWithExchange.channel as amqp.Channel,
        'assertQueue',
      );
      const assertExchangeSpy = jest.spyOn(
        amqpServiceWithExchange.channel as amqp.Channel,
        'assertExchange',
      );

      createChannelSpy = jest
        .spyOn(amqpServiceWithExchange, 'createChannel')
        .mockImplementation();

      await expect(amqpServiceWithExchange.start()).resolves.toEqual(true);

      expect(createChannelSpy).toHaveBeenCalledTimes(1);
      expect(assertQueueSpy.mock.calls).toEqual([['test', { durable: true }]]);
      expect(assertExchangeSpy.mock.calls).toEqual([
        ['topic_logs', 'topic', { durable: true }],
      ]);

      await amqpServiceWithExchange.stop();
    });

    it('should throw when unexpected error happen', async () => {
      createChannelSpy.mockRejectedValue(new Error('Unexpected Error'));

      await expect(amqpService.start()).rejects.toThrow(
        Error('Unexpected Error'),
      );

      expect(createChannelSpy).toHaveBeenCalledTimes(1);
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

      await amqpService.sendToQueue<message>(testMessage);

      expect(channelSpy.mock.calls).toEqual([
        [
          'test',
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

    it('should throw an error when both queueName and exchange are not defined', async () => {
      const noQueueNameAndExchangeAmqpService = new AmqpService(
        { url: amqpConfig.url },
        logger,
      );

      await noQueueNameAndExchangeAmqpService.start();

      await expect(
        noQueueNameAndExchangeAmqpService.consume<string>(handler),
      ).rejects.toThrow(Error('Either queue name or exchange key must be set'));

      await noQueueNameAndExchangeAmqpService.stop();
    });

    describe('When queue name is not defined', () => {
      const noQueueNameAmqpService = new AmqpService(
        {
          url: amqpConfig.url,
          exchange: { name: 'topic_logs', type: ExchangeType.topic },
        },
        logger,
      );

      it('should throw an error when channel is not defined', async () => {
        await expect(noQueueNameAmqpService.consume(handler)).rejects.toThrow(
          Error("Cannot read property 'assertQueue' of undefined"),
        );
      });

      it('should correctly call assertQueue without routingKey', async () => {
        await noQueueNameAmqpService.start();
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
        expect(bindQueueSpy.mock.calls).toEqual([
          [noQueueNameAmqpService.config.queueName, 'topic_logs', '#'],
        ]);

        await noQueueNameAmqpService.stop();
      });

      it('should correctly call assertQueue with routingKey', async () => {
        const noQueueNameWithRoutingKeyAmqpService = new AmqpService(
          {
            url: amqpConfig.url,
            exchange: { name: 'direct_logs', type: ExchangeType.direct },
            routingKey: 'routing',
          },
          logger,
        );

        await noQueueNameWithRoutingKeyAmqpService.start();
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
        expect(bindQueueSpy.mock.calls).toEqual([
          [
            noQueueNameWithRoutingKeyAmqpService.config.queueName,
            'direct_logs',
            'routing',
          ],
        ]);

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
