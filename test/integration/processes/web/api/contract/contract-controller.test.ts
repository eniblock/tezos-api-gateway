import _ from 'lodash';
import { WebProcess } from '../../../../../../src/processes/web/web-process';
import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';
import supertest from 'supertest';
import nock from 'nock';
import {
  flexibleTokenContract,
  simpleContract,
} from '../../../../../__fixtures__/smart-contract';
import { resetTable } from '../../../../../__utils__/postgre';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import { firstTx } from '../../../../../__fixtures__/transactions';
import { IndexerEnum } from '../../../../../../src/const/interfaces/indexer';
import { callGetTransactionsWithIndexer } from '../../../../../__utils__';
import { indexerConfigs } from '../../../../../../src/config';

describe('[processes/web/api/contract] Contract controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);

  webProcess.postgreService = postgreService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
    await webProcess.amqpService.channel.waitForConnect();
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.OPERATIONS);
    await resetTable(postgreService.pool, PostgreTables.JOBS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#getTransactionListOfSC', () => {
    it('should return 400 when parameter is set and indexer is set to Tzstats', async () => {
      const { body, status } = await request.get(
        `/api/contract/${flexibleTokenContract}/calls?parameter=*tz1VbHay2YPpiuPYs8SQHynuW3YvGtNuB29z*&indexer=tzstats`,
      );

      expect(status).toEqual(400);
      expect(body.message).toEqual(
        'Query param "parameter" shouldn\'t be set when query param "indexer" equals "tzstats".\' +' +
          'Either remove "parameter" to target Tzstats or remove "indexer" to automatically target TZKT',
      );
    });

    it('should return 200 and the operations list', async () => {
      const { body, status } = await request.get(
        `/api/contract/${flexibleTokenContract}/calls`,
      );

      expect(status).toEqual(200);
      expect(body).toEqual([{ ...firstTx, indexer: body[0].indexer }]);
    });

    it('should use TZKT indexer when query param "parameter" is set', async () => {
      const { body, status } = await request.get(
        `/api/contract/${flexibleTokenContract}/calls?parameter=*tz1VbHay2YPpiuPYs8SQHynuW3YvGtNuB29z*`,
      );

      expect(status).toEqual(200);
      expect(body).toEqual([{ ...firstTx, indexer: IndexerEnum.TZKT }]);
    });

    it('should return 200 and the operations list, and use TZKT indexer when query param "parameter" is set and "indexer" is set to "tzkt"', async () => {
      const { body, status } = await request.get(
        `/api/contract/${flexibleTokenContract}/calls?parameter=*tz1VbHay2YPpiuPYs8SQHynuW3YvGtNuB29z*&indexer=tzkt`,
      );

      expect(status).toEqual(200);
      expect(body).toEqual([{ ...firstTx, indexer: IndexerEnum.TZKT }]);
    });

    it('should use return the correct number of operations when query param limit is set', async () => {
      const { body, status } = await request.get(
        `/api/contract/${simpleContract}/calls?limit=20`,
      );

      expect(status).toEqual(200);
      expect(body.length).toEqual(10);
    });

    it('should return 200 and the origination operation in the operations list, and use Tzstats indexer when query param "indexer" is set to "tzstats"', async () => {
      const { body, status } = await request.get(
        `/api/contract/${flexibleTokenContract}/calls?indexer=tzstats`,
      );

      expect(status).toEqual(200);
      expect(body).toEqual([{ ...firstTx, indexer: IndexerEnum.TZSTATS }]);
    });

    it('should return 200 and the operations list without origination operation when using Tzstats indexer without "indexer" query param', async () => {
      const { body, status } = await callGetTransactionsWithIndexer(
        `/api/contract/${flexibleTokenContract}/calls`,
        IndexerEnum.TZSTATS,
        request,
      );

      expect(status).toEqual(200);
      expect(body[0].type).toEqual('transaction');
    });

    test('that all indexers returns the same operation list when using pagination and without "indexer" query param', async () => {
      const indexersResponses = [];
      for (const indexer of indexerConfigs) {
        const { body } = await callGetTransactionsWithIndexer(
          `/api/contract/${flexibleTokenContract}/calls?limit=1`,
          indexer.name,
          request,
        );
        delete body[0].indexer;

        indexersResponses.push(body);
      }

      expect(
        indexersResponses.every((response, _i, arr) =>
          _.isEqual(response, arr[0]),
        ),
      ).toBeTruthy();
    });
  });
});
