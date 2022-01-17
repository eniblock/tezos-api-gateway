import { logger } from '../../__fixtures__/services/logger';
import { amqpConfig } from '../../__fixtures__/config';
import { mock, MockProxy } from 'jest-mock-extended';

import { AmqpService } from '../../../src/services/amqp';
import { MissingMessageValidationSchemaError } from '../../../src/const/errors/missing-message-validation-schema-error';
import { ExchangeType } from '../../../src/const/exchange-type';
import * as amqpConMan from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

describe('[services/amqp] Amqp Service', () => {
  type message = {
    message: string;
  };

  const testMessage: message = { message: 'this is a test' };

  const amqpService: AmqpService = new AmqpService(amqpConfig, logger);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#start', () => {
    let connectSpy: jest.SpyInstance;

    beforeEach(async () => {
      connectSpy = jest.spyOn(amqpConMan, 'connect');
    });

    afterEach(async () => {
      await amqpService.stop();
    });

    it('should properly start the service', async () => {
      await amqpService.start();
      expect(amqpService.connection).not.toBeUndefined();
      expect(amqpService.channel).not.toBeUndefined();
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
      const connectionSpy = jest.spyOn(amqpService.connection, 'close');

      await expect(amqpService.stop()).resolves.toEqual(true);

      expect(connectionSpy.mock.calls).toEqual([[]]);
    });

    it('should throw when unexpected error happen', async () => {
      await amqpService.start();
      const connectionSpy = jest
        .spyOn(amqpService.connection, 'close')
        .mockRejectedValueOnce(new Error('Unexpected Error'));

      await expect(amqpService.stop()).rejects.toThrowError(
        Error('Unexpected Error'),
      );

      expect(connectionSpy.mock.calls).toEqual([[]]);

      await amqpService.connection.close();
    });
  });

  describe('#sendToQueue', () => {
    beforeEach(async () => {
      await amqpService.start();
    });

    afterEach(async () => {
      await amqpService.stop();
    });

    it('should correctly send message to the queue', async () => {
      const channelSpy = jest
        .spyOn(amqpService.channel, 'sendToQueue')
        .mockImplementation();

      await amqpService.sendToQueue(testMessage, 'send-transaction');

      expect(channelSpy.mock.calls).toEqual([
        [
          'send-transaction',
          { message: 'this is a test' },
          { persistent: true },
        ],
      ]);
    });
  });

  describe('#consume', () => {
    let channelConfirmMock: MockProxy<ConfirmChannel>;

    beforeEach(() => {
      channelConfirmMock = mock<ConfirmChannel>();
    });

    const handler = (_params: string) => {
      return Promise.resolve();
    };

    describe('When queue name is not defined', () => {
      const configWithoutRoutingKey = {
        url: amqpConfig.url,
        exchange: { name: 'topic_logs', type: ExchangeType.topic },
      };
      const noQueueNameAmqpService = new AmqpService(
        configWithoutRoutingKey,
        logger,
      );

      it('should correctly call assertQueue without routingKey', async () => {
        await noQueueNameAmqpService.start();
        const { name, type } = configWithoutRoutingKey.exchange;
        await noQueueNameAmqpService.channel.assertExchange(name, type, {
          durable: true,
        });

        const assertQueueSpy = jest
          .spyOn(channelConfirmMock, 'assertQueue')
          .mockResolvedValue({ queue: '', messageCount: 0, consumerCount: 0 });
        const consumeSpy = jest.spyOn(channelConfirmMock, 'consume');
        const bindQueueSpy = jest.spyOn(channelConfirmMock, 'bindQueue');

        await expect(
          noQueueNameAmqpService.consume(channelConfirmMock, handler),
        ).resolves.toEqual(undefined);

        expect(assertQueueSpy).toHaveBeenCalledTimes(1);
        expect(consumeSpy).toHaveBeenCalledTimes(1);
        expect(bindQueueSpy).toHaveBeenCalledTimes(1);

        await noQueueNameAmqpService.stop();
      });

      it('should correctly call assertQueue with routingKey', async () => {
        const configWithRoutingKey = {
          url: amqpConfig.url,
          exchange: { name: 'direct_logs', type: ExchangeType.direct },
          routingKey: 'routing',
        };
        const noQueueNameWithRoutingKeyAmqpService = new AmqpService(
          configWithRoutingKey,
          logger,
        );

        await noQueueNameWithRoutingKeyAmqpService.start();

        const assertQueueSpy = jest
          .spyOn(channelConfirmMock, 'assertQueue')
          .mockResolvedValue({ queue: '', messageCount: 0, consumerCount: 0 });
        const consumeSpy = jest
          .spyOn(channelConfirmMock, 'consume')
          .mockImplementation();
        const bindQueueSpy = jest.spyOn(channelConfirmMock, 'bindQueue');

        await expect(
          noQueueNameWithRoutingKeyAmqpService.consume(
            channelConfirmMock,
            handler,
          ),
        ).resolves.toEqual(undefined);

        expect(assertQueueSpy).toHaveBeenCalledTimes(1);
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
