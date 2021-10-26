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
import { flexibleTokenContract2 } from '../../../__fixtures__/smart-contract';
import { IndexerEnum } from '../../../../src/const/interfaces/indexer';

describe('[services/clients] Indexer Client', () => {
  const indexerClient = new IndexerClient(indexerConfigs[0], logger);
  const indexerClients = indexerConfigs.map((indexer) => {
    return new IndexerClient(indexer, logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  describe('#getOperationBlockLevel', () => {
    it('should return undefined when the indexer throw any errors that is not NOT_FOUND', async () => {
      const loggerInfoSpies: any[] = [];
      const nocks: nock.Scope[] = [];
      const indexerPromises: Promise<void>[] = [];
      for (const indexer of indexerClients) {
        loggerInfoSpies.push(jest.spyOn(indexer.logger, 'info'));

        const indexerNock = nock(indexer.config.apiUrl)
          .get(`/${indexer.config.pathToOperation}${operationHash}`)
          .reply(500);
        nocks.push(indexerNock);

        const indexerPromise = expect(
          indexer.getOperationBlockLevel(operationHash),
        ).resolves.toBeUndefined();
        indexerPromises.push(indexerPromise);
      }

      await Promise.all(indexerPromises);

      indexerClients.forEach((_indexerClient, i) => {
        nocks[i].done();
        expect(loggerInfoSpies[i]).toHaveBeenCalled();
      });
    });

    it('should throw OperationNotFoundError', async () => {
      const indexerPromises: Promise<void>[] = [];
      for (const indexer of indexerClients) {
        indexerPromises.push(
          expect(
            indexer.getOperationBlockLevel(notFoundOperationHash),
          ).rejects.toThrowError(OperationNotFoundError),
        );
      }
      await Promise.all(indexerPromises);
    }, 8000);

    it('should return the block level of the operation', async () => {
      const indexerPromises: Promise<void>[] = [];
      for (const indexer of indexerClients) {
        indexerPromises.push(
          expect(
            indexer.getOperationBlockLevel(operationHash),
          ).resolves.toEqual(265526),
        );
      }
      await Promise.all(indexerPromises);
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

  describe('#getTransactionListOfSC', () => {
    it('should return the block level of the operation', async () => {
      const originationOp = {
        indexer: IndexerEnum.TZSTATS,
        destination: 'KT1PC7JUBQQXawknSuZrkEvsphG7n55QNpEv',
        source: 'tz1QdgwqsVV7SmpFPrWjs9B5oBNcj2brzqfG',
        timestamp: '2021-10-21T08:32:39Z',
        status: 'applied',
        bakerFee: 0.003649,
        storageFee: 0.8535,
        storage_limit: 3414,
        counter: 365115,
        hash: 'onvByVBBjEQhYHnT72wy1wMDmp4Hznj5i1T7QU6wjjTEraWbwN8',
        block: 'BLR39HJGPvpsVGSkVKuppXP4rZCR4oBoEzfjoXjo2aXmaZbrx9C',
        type: 'origination',
        height: 597774,
        parameters: '',
        entrypoint: undefined,
      };
      const firstTx = {
        destination: 'KT1PC7JUBQQXawknSuZrkEvsphG7n55QNpEv',
        source: 'tz1QdgwqsVV7SmpFPrWjs9B5oBNcj2brzqfG',
        timestamp: '2021-10-21T16:24:19Z',
        status: 'applied',
        bakerFee: 0.000839,
        storageFee: 0.01675,
        storage_limit: 67,
        counter: 365117,
        hash: 'onefEAXu4hq9JHxJRM47rvHmkiVf3SYRe9M7PnNgvjhrRvza8UN',
        block: 'BMaCpTdnbCzUcQhXgL9FQUJwkdzvgzxmLG4Hyzac882FTMir8jT',
        type: 'transaction',
        height: 599142,
        entrypoint: 'transfer',
        parameters: {
          destination: 'tz1MPQBaR1r4hKveeCnNYPExnme5KBpbkWUP',
          tokens: '5',
        },
      };
      const indexerPromises: Promise<void>[] = [];
      for (const indexer of indexerClients) {
        // TZKT doesn't return the origination transaction
        if (indexer.config.name === IndexerEnum.TZKT) {
          indexerPromises.push(
            expect(
              indexer.getTransactionListOfSC(flexibleTokenContract2, {}),
            ).resolves.toEqual([{ ...firstTx, indexer: IndexerEnum.TZKT }]),
          );
        } else if (indexer.config.name === IndexerEnum.TZSTATS) {
          indexerPromises.push(
            expect(
              indexer.getTransactionListOfSC(flexibleTokenContract2, {}),
            ).resolves.toEqual([
              originationOp,
              { ...firstTx, indexer: IndexerEnum.TZSTATS },
            ]),
          );
        }
      }
      await Promise.all(indexerPromises);
    });
  });
});
