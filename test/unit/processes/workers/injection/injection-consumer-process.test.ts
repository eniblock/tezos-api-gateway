import { InjectionConsumerProcess } from '../../../../../src/processes/workers/injection/injection-consumer-process';
import { logger } from '../../../../__fixtures__/services/logger';

describe('[processes/workers/injection] Injection Consumer Process', () => {
  const injectionConsumerProcess = new InjectionConsumerProcess(logger);

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('#start', () => {
    afterEach(async () => {
      await injectionConsumerProcess.stop();
    });

    const initializeDatabaseSpy = jest
      .spyOn(injectionConsumerProcess.postgreService, 'initializeDatabase')
      .mockImplementation();
    const startAmqpSpy = jest
      .spyOn(injectionConsumerProcess.amqpService, 'start')
      .mockImplementation();

    it('should correctly start the injection worker', async () => {
      await expect(injectionConsumerProcess.start()).resolves.toEqual(true);

      expect(initializeDatabaseSpy).toHaveBeenCalledTimes(1);
      expect(startAmqpSpy).toHaveBeenCalledTimes(1);
      expect(injectionConsumerProcess.amqpService.schema).toEqual({
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
      });
    });

    it('if the process already started, should not start again', async () => {
      await injectionConsumerProcess.start();

      await expect(injectionConsumerProcess.start()).resolves.toEqual(false);

      expect(initializeDatabaseSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('#stop', () => {
    const postgreDisconnectSpy = jest
      .spyOn(injectionConsumerProcess.postgreService, 'disconnect')
      .mockImplementation();
    const stopAmqpSpy = jest
      .spyOn(injectionConsumerProcess.amqpService, 'stop')
      .mockImplementation();

    it('should correctly start the injection worker', async () => {
      await injectionConsumerProcess.start();

      await expect(injectionConsumerProcess.stop()).resolves.toEqual(true);

      expect(postgreDisconnectSpy).toHaveBeenCalledTimes(1);
      expect(stopAmqpSpy).toHaveBeenCalledTimes(1);
    });

    it('if the process already started, should not start again', async () => {
      await expect(injectionConsumerProcess.stop()).resolves.toEqual(false);

      expect(postgreDisconnectSpy).toHaveBeenCalledTimes(0);
      expect(stopAmqpSpy).toHaveBeenCalledTimes(0);
    });
  });
});
