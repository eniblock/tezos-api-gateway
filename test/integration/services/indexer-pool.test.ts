import _ from 'lodash';
import nock from 'nock';
import { indexerConfigs } from '../../../src/config';
import {
  OperationFailedError,
  OperationNotFoundError,
} from '../../../src/const/errors/indexer-error';
import { IndexerClient } from '../../../src/services/clients/indexer-client';
import { IndexerPool } from '../../../src/services/indexer-pool';
import { TezosService } from '../../../src/services/tezos';
import { tezosNodeUrl } from '../../__fixtures__/config';
import { notFoundOperationHash } from '../../__fixtures__/operation';
import { logger } from '../../__fixtures__/services/logger';
import { BlockResponse } from '@taquito/rpc';
import { failedTx, firstTx } from '../../__fixtures__/transactions';

describe('[services/indexer-pool]', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#initializeIndexers', () => {
    it('should properly create all the indexer clients', async () => {
      const indexerPool = new IndexerPool(logger);

      const indexerNames = indexerConfigs.map(
        (indexerConfig) => indexerConfig.name,
      );

      await indexerPool.initializeIndexers();

      const indexerNamesExistInPool = indexerPool.indexers.map(
        (indexer) => indexer.config.name,
      );

      expect(_.difference(indexerNamesExistInPool, indexerNames)).toEqual([]);
    });
  });

  describe('#getOperationBlockLevelByRandomIndexer', () => {
    const indexerPool = new IndexerPool(logger);
    let loggerErrorSpy: jest.SpyInstance;
    let firstIndexer: IndexerClient;

    beforeAll(async () => {
      await indexerPool.initializeIndexers();
      firstIndexer = indexerPool.indexers[0];
    });

    beforeEach(() => {
      loggerErrorSpy = jest.spyOn(indexerPool.logger, 'error');
    });

    afterEach(() => {
      jest.restoreAllMocks();
      nock.cleanAll();
    });

    it('should throw OperationNotFoundError without calling logger error', async () => {
      await expect(
        indexerPool.getOperationBlockLevelByRandomIndexer(
          notFoundOperationHash,
          3,
        ),
      ).rejects.toThrowError(OperationNotFoundError);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
    }, 8000);

    it('should throw OperationFailedError without calling logger error', async () => {
      await expect(
        indexerPool.getOperationBlockLevelByRandomIndexer(failedTx.hash, 3),
      ).rejects.toThrowError(OperationFailedError);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
    }, 8000);

    it('should throw unexpected error and call the logger error', async () => {
      const getRandomIndexerSpy = jest
        .spyOn(indexerPool, 'getRandomIndexer')
        .mockImplementation(() => {
          throw new Error('Unexpected error');
        });

      await expect(
        indexerPool.getOperationBlockLevelByRandomIndexer(firstTx.hash, 3),
      ).rejects.toThrowError(Error('Unexpected error'));

      expect(loggerErrorSpy.mock.calls).toEqual([
        [
          {
            err: Error('Unexpected error'),
          },
          '[IndexerPool/getOperationByRandomIndexer] Unexpected error happened',
        ],
      ]);
      expect(getRandomIndexerSpy).toHaveBeenCalledTimes(1);
    });

    it('should return undefined if can not get operation after all retry times', async () => {
      const getRandomIndexerSpy = jest
        .spyOn(indexerPool, 'getRandomIndexer')
        .mockReturnValue(firstIndexer);

      const indexerNock = nock(firstIndexer.config.apiUrl)
        .get(`/${firstIndexer.config.pathToOperation}${firstTx.hash}`)
        .times(3)
        .reply(500);

      await expect(
        indexerPool.getOperationBlockLevelByRandomIndexer(firstTx.hash, 3),
      ).resolves.toBeUndefined();

      indexerNock.done();
      expect(getRandomIndexerSpy).toHaveBeenCalledTimes(3);
    }, 8000);

    // it('if an indexer does not work, should change the indexer and return the result if the 2nd indexer works', async () => {
    //   const getRandomIndexerSpy = jest
    //     .spyOn(indexerPool, 'getRandomIndexer')
    //     .mockReturnValueOnce(firstIndexer)
    //     .mockReturnValueOnce(indexerPool.indexers[1]);

    //   const indexerNock = nock(firstIndexer.config.apiUrl)
    //     .get(`/${firstIndexer.config.pathToOperation}${firstTx.hash}`)
    //     .reply(500);

    //   await expect(
    //     indexerPool.getOperationBlockLevelByRandomIndexer(firstTx.hash, 3),
    //   ).resolves.toEqual(firstTx.height);

    //   indexerNock.done();
    //   expect(getRandomIndexerSpy).toHaveBeenCalledTimes(2);
    // });

    it('should properly return the block level of the operation', async () => {
      await expect(
        indexerPool.getOperationBlockLevelByRandomIndexer(firstTx.hash, 3),
      ).resolves.toEqual(firstTx.height);
    });
  });

  describe('#checkIfOperationIsConfirmedByRandomIndexer', () => {
    const indexerPool = new IndexerPool(logger);
    const tezosService = new TezosService(tezosNodeUrl);

    let loggerErrorSpy: jest.SpyInstance;
    let firstIndexer: IndexerClient;

    beforeAll(async () => {
      await indexerPool.initializeIndexers();
      firstIndexer = indexerPool.indexers[0];
    });

    beforeEach(() => {
      loggerErrorSpy = jest.spyOn(indexerPool.logger, 'error');
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should throw OperationNotFoundError without calling logger error', async () => {
      await expect(
        indexerPool.checkIfOperationIsConfirmedByRandomIndexer(
          tezosService,
          {
            operationHash: notFoundOperationHash,
            nbOfConfirmation: 20,
          },
          3,
        ),
      ).rejects.toThrowError(OperationNotFoundError);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
    }, 8000);

    it('should throw unexpected error and call the logger error', async () => {
      const getRandomIndexerSpy = jest
        .spyOn(indexerPool, 'getRandomIndexer')
        .mockImplementation(() => {
          throw new Error('Unexpected error');
        });

      await expect(
        indexerPool.checkIfOperationIsConfirmedByRandomIndexer(
          tezosService,
          {
            operationHash: firstTx.hash,
            nbOfConfirmation: 20,
          },
          3,
        ),
      ).rejects.toThrowError(Error('Unexpected error'));

      expect(loggerErrorSpy.mock.calls).toEqual([
        [
          {
            err: Error('Unexpected error'),
          },
          '[IndexerPool/checkIfOperationIsConfirmedByRandomIndexer] Unexpect error happened',
        ],
      ]);
      expect(getRandomIndexerSpy).toHaveBeenCalledTimes(1);
    }, 8000);

    it('should return undefined if can not get operation after all retry times', async () => {
      const getRandomIndexerSpy = jest
        .spyOn(indexerPool, 'getRandomIndexer')
        .mockReturnValue(firstIndexer);

      const indexerNock = nock(firstIndexer.config.apiUrl)
        .get(`/${firstIndexer.config.pathToOperation}${firstTx.hash}`)
        .times(3)
        .reply(500);

      await expect(
        indexerPool.checkIfOperationIsConfirmedByRandomIndexer(
          tezosService,
          {
            operationHash: firstTx.hash,
            nbOfConfirmation: 20,
          },
          3,
        ),
      ).resolves.toBeUndefined();

      indexerNock.done();
      expect(getRandomIndexerSpy).toHaveBeenCalledTimes(3);
    }, 8000);

    // it('if an indexer does not work, should change the indexer and return the result if the 2nd indexer works', async () => {
    //   const getRandomIndexerSpy = jest
    //     .spyOn(indexerPool, 'getRandomIndexer')
    //     .mockReturnValueOnce(firstIndexer)
    //     .mockReturnValueOnce(indexerPool.indexers[1]);

    //   const indexerNock = nock(firstIndexer.config.apiUrl)
    //     .get(`/${firstIndexer.config.pathToOperation}${firstTx.hash}`)
    //     .reply(500);

    //   await expect(
    //     indexerPool.checkIfOperationIsConfirmedByRandomIndexer(
    //       tezosService,
    //       {
    //         operationHash: firstTx.hash,
    //         nbOfConfirmation: 20,
    //       },
    //       3,
    //     ),
    //   ).resolves.toEqual(true);

    //   indexerNock.done();
    //   expect(getRandomIndexerSpy).toHaveBeenCalledTimes(2);
    // });

    it('should properly return true if the operation is confirmed', async () => {
      await expect(
        indexerPool.checkIfOperationIsConfirmedByRandomIndexer(
          tezosService,
          {
            operationHash: firstTx.hash,
            nbOfConfirmation: 20,
          },
          3,
        ),
      ).resolves.toEqual(true);
    });

    it('should properly return false if the operation is not confirmed', async () => {
      const blockHeader: BlockResponse = {
        header: { level: 109646 },
      } as unknown as BlockResponse;
      const getLatestBlockSpy = jest
        .spyOn(tezosService, 'getLatestBlock')
        .mockResolvedValue(blockHeader);

      await expect(
        indexerPool.checkIfOperationIsConfirmedByRandomIndexer(
          tezosService,
          {
            operationHash: firstTx.hash,
            nbOfConfirmation: 20,
          },
          3,
        ),
      ).resolves.toEqual(false);

      expect(getLatestBlockSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw OperationFailed error if the operation exist but failed', async () => {
      await expect(
        indexerPool.checkIfOperationIsConfirmedByRandomIndexer(
          tezosService,
          {
            operationHash: failedTx.hash,
            nbOfConfirmation: 20,
          },
          3,
        ),
      ).rejects.toThrowError(OperationFailedError);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
    });
  });
});
