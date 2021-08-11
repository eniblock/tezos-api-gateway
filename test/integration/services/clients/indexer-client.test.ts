import nock from 'nock';
import { BlockResponse } from '@taquito/rpc';

import {
  notFoundOperationHash,
  operationHash,
} from '../../../__fixtures__/operation';
import { logger } from '../../../__fixtures__/services/logger';
import { tezosNodeGranadaUrl } from '../../../__fixtures__/config';

import { IndexerClient } from '../../../../src/services/clients/indexer-client';
import { indexerConfigs } from '../../../../src/config';
import { OperationNotFoundError } from '../../../../src/const/errors/indexer-error';
import { TezosService } from '../../../../src/services/tezos';

describe('[services/clients] Indexer Client', () => {
  const indexerClient = new IndexerClient(indexerConfigs[0], logger);

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  describe('#getOperationBlockLevel', () => {
    const betterCallIndexerClient = new IndexerClient(
      indexerConfigs[1],
      logger,
    );

    it('should return undefined when the indexer throw any errors that is not NOT_FOUND', async () => {
      const loggerInfoSpy = jest.spyOn(indexerClient.logger, 'info');
      const indexerNock = nock(indexerClient.config.apiUrl)
        .get(`/${indexerClient.config.pathToOperation}${operationHash}`)
        .reply(500);

<<<<<<< HEAD
      const conseilIndexerNock = nock(conseilIndexerClient.config.apiUrl)
        .get(`/${conseilIndexerClient.config.pathToOperation}${operationHash}`)
=======
      const conseilIndexerNock = nock(betterCallIndexerClient.config.apiUrl)
        .get(`/${operationHash}`)
>>>>>>> develop
        .reply(500);

      await expect(
        indexerClient.getOperationBlockLevel(operationHash),
      ).resolves.toBeUndefined();
      await expect(
        betterCallIndexerClient.getOperationBlockLevel(operationHash),
      ).resolves.toBeUndefined();

      indexerNock.done();
      conseilIndexerNock.done();

      expect(loggerInfoSpy).toHaveBeenCalled();
    });

    it('should throw OperationNotFoundError', async () => {
      await expect(
        indexerClient.getOperationBlockLevel(notFoundOperationHash),
      ).rejects.toThrowError(OperationNotFoundError);
      await expect(
        betterCallIndexerClient.getOperationBlockLevel(notFoundOperationHash),
      ).rejects.toThrowError(OperationNotFoundError);
    }, 8000);

    it('should return the block level of the operation', async () => {
      await expect(
        indexerClient.getOperationBlockLevel(operationHash),
      ).resolves.toEqual(265526);
      await expect(
        betterCallIndexerClient.getOperationBlockLevel(operationHash),
      ).resolves.toEqual(265526);
    }, 8000);
  });

  describe('#checkIfOperationIsConfirmed', () => {
    const tezosService = new TezosService(tezosNodeGranadaUrl);
    let loggerErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      loggerErrorSpy = jest.spyOn(indexerClient.logger, 'error');
    });

    it('should throw when unexpected error happened', async () => {
      const getLatestBlockSpy = jest
        .spyOn(tezosService, 'getLatestBlock')
        .mockRejectedValue(
          new Error(
            'Could not find an operation with this hash: ' + operationHash,
          ),
        );

      await expect(
        indexerClient.checkIfOperationIsConfirmed(
          tezosService,
          operationHash,
          20,
        ),
      ).rejects.toThrow(
        Error('Could not find an operation with this hash: ' + operationHash),
      );

      expect(getLatestBlockSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy.mock.calls).toEqual([
        [
          {
            err: Error(
              'Could not find an operation with this hash: ' + operationHash,
            ),
          },
          '[IndexerClient/checkIfOperationIsConfirmed] Unexpected error happened',
        ],
      ]);
    }, 8000);

    it('should throw when OperationNotFoundError happened but do not log error', async () => {
      await expect(
        indexerClient.checkIfOperationIsConfirmed(
          tezosService,
          notFoundOperationHash,
          20,
        ),
      ).rejects.toThrow(OperationNotFoundError);

      expect(loggerErrorSpy.mock.calls).toEqual([]);
    }, 8000);

    it('should return undefined the block level is undefined', async () => {
      const indexerNock = nock(indexerClient.config.apiUrl)
        .get(`/${indexerClient.config.pathToOperation}${operationHash}`)
        .reply(500);

      await expect(
        indexerClient.checkIfOperationIsConfirmed(
          tezosService,
          operationHash,
          20,
        ),
      ).resolves.toBeUndefined();

      indexerNock.done();
    });

    it('should return false when difference between current block and operation block us not bigger than number of confirmation', async () => {
      const blockHeader: BlockResponse = ({
        header: { level: 109646 },
      } as unknown) as BlockResponse;
      const getLatestBlockSpy = jest
        .spyOn(tezosService, 'getLatestBlock')
        .mockResolvedValue(blockHeader);

      await expect(
        indexerClient.checkIfOperationIsConfirmed(
          tezosService,
          operationHash,
          20,
        ),
      ).resolves.toEqual(false);

      expect(getLatestBlockSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy.mock.calls).toEqual([]);
    }, 8000);

    it('should return true when the operation is confirmed', async () => {
      await expect(
        indexerClient.checkIfOperationIsConfirmed(
          tezosService,
          operationHash,
          17,
        ),
      ).resolves.toEqual(true);
    }, 8000);
  });
});
