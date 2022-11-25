import { WebProcess } from '../../../../../../src/processes/web/web-process';
import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';
import supertest from 'supertest';
import nock from 'nock';
import { nonValidContract } from '../../../../../__fixtures__/smart-contract';
import { resetTable } from '../../../../../__utils__/postgre';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import {
  contractWithEvents,
  events,
  operationWithEvents,
} from '../../../../../__fixtures__/events';
import { notFoundOperationHash } from '../../../../../__fixtures__/operation';

describe('[processes/web/api/contract/events] Get Contract events controller', () => {
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

  describe('#getContractEvents', () => {
    it('Should return 400 when the contract param does not have a good format', async () => {
      const { body, status } = await request.get('/api/contract/events').query({
        contract: 'badFormat',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.query.contract should match pattern "^KT+[0-9a-zA-Z]{34}$"',
        status: 400,
      });
    });

    it('Should return 400 when the operationHash does not have a good format', async () => {
      const { body, status } = await request.get('/api/contract/events').query({
        operationHash: 'badFormat',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.query.operationHash should match pattern "^o+[0-9a-zA-Z]{50}$"',
        status: 400,
      });
    });

    it('Should return 400 when the indexer parameter is different from "tzkt"', async () => {
      const { body, status } = await request.get('/api/contract/events').query({
        indexer: 'tzstats',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.query.indexer should be equal to one of the allowed values: tzkt',
        status: 400,
      });
    });

    it('should return 200 and the latest 20 contract events respecting (default limit) ', async () => {
      const { body, status } = await request.get(`/api/contract/events`);

      expect(status).toEqual(200);
      expect(body.length).toEqual(20);
    });

    it('Should return 200 and empty list when the contract address does not exist', async () => {
      const { body, status } = await request
        .get('/api/contract/events')
        .query({ contract: nonValidContract });

      expect(status).toEqual(200);
      expect(body).toEqual([]);
    });

    it('Should return 200 and empty list when the operationHash does not exist', async () => {
      const { body, status } = await request
        .get(`/api/contract/events`)
        .query({ operationHash: notFoundOperationHash });

      expect(body).toEqual([]);
      expect(status).toEqual(200);
    });

    it('should return 200 and only event list of the specific contract set in parameters', async () => {
      const { body, status } = await request
        .get(`/api/contract/events`)
        .query({ contract: contractWithEvents });

      expect(status).toEqual(200);
      expect(body).toEqual(events);
    });

    it('should return 200 and the events of the specified operation when operationHash param is set', async () => {
      const { body, status } = await request.get(`/api/contract/events`).query({
        operationHash: operationWithEvents,
      });

      expect(body).toEqual([events[1]]);
      expect(status).toEqual(200);
    });

    it('should use return the correct number of tokens when query param limit is set', async () => {
      const { body, status } = await request.get(`/api/contract/events`);
      expect(status).toEqual(200);
      expect(body.length).toEqual(20);

      const { body: body2, status: status2 } = await request
        .get(`/api/contract/events`)
        .query({ limit: 2 });
      expect(status2).toEqual(200);
      expect(body2.length).toEqual(2);
    });

    it('should use return the correct tokens when query param offset is set', async () => {
      const { body, status } = await request
        .get(`/api/contract/events`)
        .query({ offset: 1, contract: contractWithEvents });
      expect(status).toEqual(200);
      expect(body).toEqual([events[1]]);
    });

    it('should invert tokens order when query param order is set to "desc"', async () => {
      const { body, status } = await request
        .get(`/api/contract/events`)
        .query({ order: 'desc', contract: contractWithEvents });
      expect(status).toEqual(200);
      expect(body).toEqual([events[1], events[0]]);
    });
  });
});
