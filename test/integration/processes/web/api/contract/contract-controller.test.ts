import { WebProcess } from '../../../../../../src/processes/web/web-process';
import {
  // amqpConfig,
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';
// import { AmqpService } from '../../../../../../src/services/amqp';
// import { logger } from '../../../../../__fixtures__/services/logger';
import supertest from 'supertest';
import nock from 'nock';
import { flexibleTokenContract } from '../../../../../__fixtures__/smart-contract';
import { resetTable } from '../../../../../__utils__/postgre';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import { firstTx } from '../../../../../__fixtures__/transactions';
import { IndexerEnum } from '../../../../../../src/const/interfaces/indexer';

describe('[processes/web/api/contract] Contract controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);
  //
  webProcess.postgreService = postgreService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
    await webProcess.amqpService.channel.waitForConnect();
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.TRANSACTION);
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
    it('should return 200 and the transactions list', async () => {
      const { body, status } = await request.get(
        `/api/contract/${flexibleTokenContract}/calls`,
      );

      expect(status).toEqual(200);
      expect(body.length).toBeGreaterThan(0);
    });

    it('should use TZKT indexer when parameter query param is set', async () => {
      const { body, status } = await request.get(
        `/api/contract/${flexibleTokenContract}/calls?parameter=*tz1VbHay2YPpiuPYs8SQHynuW3YvGtNuB29z*`,
      );

      expect(status).toEqual(200);
      expect(body).toEqual([{ ...firstTx, indexer: IndexerEnum.TZKT }]);
    });
  });
});
