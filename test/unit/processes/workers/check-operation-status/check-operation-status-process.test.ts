import { logger } from '../../../../__fixtures__/services/logger';
import { CheckOperationStatusProcess } from '../../../../../src/processes/workers/check-operation-status/check-operation-status-process';
import * as checkOperationStatusLib from '../../../../../src/processes/workers/check-operation-status/lib/check-operation-status';
import { TezosService } from '../../../../../src/services/tezos';
import { tezosNodeGranadaUrl } from '../../../../__fixtures__/config';

describe('[processes/workers/check-operation-status] Check Operation Status Process', () => {
  const checkOperationStatusProcess = new CheckOperationStatusProcess(logger);

  const checkOperationStatusSpy = jest
    .spyOn(checkOperationStatusLib, 'checkOperationStatus')
    .mockImplementation();

  const tezosService = new TezosService(tezosNodeGranadaUrl);
  let getTezosServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    getTezosServiceSpy = jest
      .spyOn(checkOperationStatusProcess.gatewayPool, 'getTezosService')
      .mockResolvedValue(tezosService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('#start', () => {
    afterEach(async () => {
      await checkOperationStatusProcess.stop();
    });

    it('should correctly start the check-operation-status worker', async () => {
      await expect(checkOperationStatusProcess.start()).resolves.toEqual(true);

      expect(checkOperationStatusProcess.indexerPool.indexers.length).toEqual(
        2,
      );
      expect(checkOperationStatusSpy.mock.calls).toEqual([
        [
          {
            postgreService: checkOperationStatusProcess.postgreService,
            tezosService,
            amqpService: checkOperationStatusProcess.amqpService,
            indexerPool: checkOperationStatusProcess.indexerPool,
          },
          logger,
        ],
      ]);
      expect(getTezosServiceSpy).toHaveBeenCalledTimes(1);
    });

    it('if the process already started, should not start again', async () => {
      await checkOperationStatusProcess.start();

      await expect(checkOperationStatusProcess.start()).resolves.toEqual(false);
    });
  });

  describe('#stop', () => {
    const postgreDisconnectSpy = jest
      .spyOn(checkOperationStatusProcess.postgreService, 'disconnect')
      .mockImplementation();

    it('should correctly start the check-operation-status worker', async () => {
      await checkOperationStatusProcess.start();

      await expect(checkOperationStatusProcess.stop()).resolves.toEqual(true);

      expect(postgreDisconnectSpy).toHaveBeenCalledTimes(1);
    });

    it('if the process already started, should not start again', async () => {
      await expect(checkOperationStatusProcess.stop()).resolves.toEqual(false);

      expect(postgreDisconnectSpy).toHaveBeenCalledTimes(0);
    });
  });
});
