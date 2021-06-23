import nock from 'nock';
import { BlockResponse } from '@taquito/rpc';

import {
  notFoundOperationHash,
  operationHash,
} from '../../../__fixtures__/operation';
import { logger } from '../../../__fixtures__/services/logger';
import { tezosNodeEdonetUrl } from '../../../__fixtures__/config';

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
    const conseilIndexerClient = new IndexerClient(indexerConfigs[3], logger);

    it('should return undefined when the indexer throw any errors that is not NOT_FOUND', async () => {
      const loggerInfoSpy = jest.spyOn(indexerClient.logger, 'info');
      const indexerNock = nock(indexerClient.config.apiUrl)
        .get(`/${operationHash}`)
        .reply(500);

      const conseilIndexerNock = nock(conseilIndexerClient.config.apiUrl)
        .get(`/${operationHash}`)
        .reply(500);

      await expect(
        indexerClient.getOperationBlockLevel(operationHash),
      ).resolves.toBeUndefined();
      await expect(
        conseilIndexerClient.getOperationBlockLevel(operationHash),
      ).resolves.toBeUndefined();

      indexerNock.done();
      conseilIndexerNock.done();

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        {
          err: Error('Internal Server Error'),
          requestDetails: {
            indexerConfig: {
              name: 'conseil',
              apiUrl:
                'https://conseil-edo.cryptonomic-infra.tech:443/v2/data/tezos/edonet/operation_groups/',
              keyToOperation: 'operation_group',
              keyToBlockLevel: 'blockLevel',
              apiKey: '503801e8-a8a0-4e7c-8c24-7bd310805843',
            },
            operationHash:
              'oneW5x7bCPCdkoJqC9HXWx42GdjDS6Z7nHeQt4mfYaPnw8xdM9E',
          },
        },
        'Server error',
      );
    });

    it('should throw OperationNotFoundError', async () => {
      await expect(
        indexerClient.getOperationBlockLevel(notFoundOperationHash),
      ).rejects.toThrowError(OperationNotFoundError);
      await expect(
        conseilIndexerClient.getOperationBlockLevel(notFoundOperationHash),
      ).rejects.toThrowError(OperationNotFoundError);
    }, 8000);

    it('should return the block level of the operation', async () => {
      await expect(
        indexerClient.getOperationBlockLevel(operationHash),
      ).resolves.toEqual(109636);
      await expect(
        conseilIndexerClient.getOperationBlockLevel(operationHash),
      ).resolves.toEqual(109636);
    }, 8000);
  });

  describe('#checkIfOperationIsConfirmed', () => {
    const tezosService = new TezosService(tezosNodeEdonetUrl);
    let loggerErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      loggerErrorSpy = jest.spyOn(indexerClient.logger, 'error');
    });

    it('should throw when unexpected error happened', async () => {
      const getLatestBlockSpy = jest
        .spyOn(tezosService, 'getLatestBlock')
        .mockRejectedValue(new Error('Unexpected Error'));

      await expect(
        indexerClient.checkIfOperationIsConfirmed(
          tezosService,
          operationHash,
          20,
        ),
      ).rejects.toThrow(Error('Unexpected Error'));

      expect(getLatestBlockSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy.mock.calls).toEqual([
        [
          {
            err: Error('Unexpected Error'),
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
        .get(`/${operationHash}`)
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
      const blockHeader: BlockResponse = {
        header: { level: 109646 },
      } as unknown as BlockResponse;
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
          20,
        ),
      ).resolves.toEqual(true);
    }, 8000);
  });
});
