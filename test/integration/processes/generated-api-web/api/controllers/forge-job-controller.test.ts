import supertest from 'supertest';

import {
  postgreConfig,
  serverConfig,
  tezosNodeGranadaUrl,
} from '../../../../../__fixtures__/config';
import { resetTable, selectData } from '../../../../../__utils__/postgre';

import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import { PostgreService } from '../../../../../../src/services/postgre';
import { TezosService } from '../../../../../../src/services/tezos';
import { WebProcess } from '../../../../../../src/processes/generated-api-web/web-process';
import * as generateTransactionDetailsLib from '../../../../../../src/helpers/generate-transaction-details';
import {
  flexibleTokenContract,
  testAccount,
  testAccount2,
} from '../../../../../__fixtures__/smart-contract';

describe('[processes/generated-api-web/api/controllers] Forge job controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeGranadaUrl);

  webProcess.postgreService = postgreService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.TRANSACTION);
    await resetTable(postgreService.pool, PostgreTables.JOBS);

    jest
      .spyOn(webProcess.gatewayPool, 'getTezosService')
      .mockResolvedValue(tezosService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#forgeOperationAndCreateJob', () => {
    it('should return 404 when there is no such an entry point in the smart contract', async () => {
      const { body, status } = await request
        .post('/api/forge/transferMany')
        .send({
          sourceAddress: testAccount,
        });

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: 'not found',
        status: 404,
      });
    });

    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request.post('/api/forge/transfer').send({
        sourceAddress: testAccount,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'parameters'",
        status: 400,
      });
    });

    it('should return 400 when there is an extra parameter in request param', async () => {
      const { body, status } = await request.post('/api/forge/lock').send({
        parameters: {
          tokens: 1,
          destination: testAccount2,
        },
        sourceAddress: testAccount,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.body should NOT have additional properties',
        status: 400,
      });
    });

    it('should return 400 when there is a parameter not match the format', async () => {
      const { body, status } = await request.post('/api/forge/transfer').send({
        parameters: {
          tokens: 1,
          destination: testAccount.substring(0, 35),
        },
        sourceAddress: testAccount,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.body.parameters.destination should match pattern "^[0-9a-zA-Z]{36}$"',
        status: 400,
      });
    });

    it('should return 400 when entry point parameters have extra parameter', async () => {
      const { body, status } = await request.post('/api/forge/transfer').send({
        parameters: {
          tokens: 1,
          destination: testAccount2,
          from: testAccount2,
        },
        sourceAddress: testAccount,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.body.parameters should NOT have additional properties',
        status: 400,
      });
    });

    it('should return 500 when unexpected error happen', async () => {
      jest
        .spyOn(generateTransactionDetailsLib, 'generateTransactionDetails')
        .mockImplementation(() => {
          throw new Error();
        });

      const { body, status } = await request.post('/api/forge/transfer').send({
        parameters: {
          tokens: 1,
          destination: testAccount2,
        },
        sourceAddress: testAccount,
      });

      expect(status).toEqual(500);
      expect(body).toEqual({
        message: 'Internal Server Error',
        status: 500,
      });
    });

    it('should return 201 and correctly inserted data in the database', async () => {
      const { body, status } = await request.post('/api/forge/transfer').send({
        parameters: {
          tokens: 1,
          destination: testAccount2,
        },
        sourceAddress: testAccount,
      });

      expect({ body, status }).toEqual({
        status: 201,
        body: {
          id: body.id,
          raw_transaction: body.raw_transaction,
          operation_hash: null,
          status: 'created',
          error_message: null,
        },
      });

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([body]);

      const insertedForgeParameters = await selectData(postgreService.pool, {
        tableName: PostgreTables.TRANSACTION,
        selectFields:
          'destination, parameters, parameters_json, amount, fee, source, storage_limit, gas_limit, counter, branch, job_id',
      });

      expect(insertedForgeParameters).toEqual([
        {
          destination: flexibleTokenContract,
          parameters:
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"' +
            testAccount2 +
            '"},{"int":"1"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"tokens":1,"destination":"' +
            testAccount2 +
            '"}}}',
          amount: 0,
          fee: 840,
          source: testAccount,
          storage_limit: 67,
          gas_limit: 4925,
          branch: insertedForgeParameters[0].branch,
          counter: insertedForgeParameters[0].counter,
          job_id: body.id,
        },
      ]);

      expect(insertedForgeParameters[0].branch).not.toBeNull();
      expect(insertedForgeParameters[0].counter).not.toBeNull();
    }, 8000);
  });
});
