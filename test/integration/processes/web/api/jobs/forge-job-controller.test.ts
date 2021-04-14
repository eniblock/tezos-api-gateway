import supertest from 'supertest';

import {
  postgreConfig,
  serverConfig,
  tezosNodeEdonetUrl,
} from '../../../../../__fixtures__/config';
import { resetTable, selectData } from '../../../../../__utils__/postgre';
import {
  FA2Contract,
  flexibleTokenContract,
  testAccount,
} from '../../../../../__fixtures__/smart-contract';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import { PostgreService } from '../../../../../../src/services/postgre';
import { TezosService } from '../../../../../../src/services/tezos';
import { ForgeOperationParams } from '../../../../../../src/const/interfaces/forge-operation-params';

describe('[processes/web/api/jobs] Forge job controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeEdonetUrl);

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
    const requestParam: ForgeOperationParams = {
      transactions: [
        {
          contractAddress: flexibleTokenContract,
          entryPoint: 'transfer',
          entryPointParams: {
            tokens: 1,
            destination: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
          },
        },
        {
          contractAddress: flexibleTokenContract,
          entryPoint: 'lock',
        },
      ],
      sourceAddress: testAccount,
    };

    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request.post('/api/forge/jobs').send({
        sourceAddress: 'tz1hXdta423VkiVrxDzX8VXe2sGwCiiZfPo7',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'transactions'",
        status: 400,
      });
    });

    it('should return 400 when there is an extra parameter in request param', async () => {
      const { body, status } = await request.post('/api/forge/jobs').send({
        ...requestParam,
        extra: 'extra',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.body should NOT have additional properties',
        status: 400,
      });
    });

    it('should return 400 when there is a parameter not match the format', async () => {
      const { body, status } = await request.post('/api/forge/jobs').send({
        ...requestParam,
        transactions: [
          {
            contractAddress: 'KT1938ykzsYS1FR3WAyTa2BUTuTadtV1M9v',
            entryPoint: 'transfer',
            entryPointParams: {
              tokens: 1,
              destination: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
            },
          },
        ],
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.body.transactions[0].contractAddress should match pattern "^[0-9a-zA-Z]{36}$"',
        status: 400,
      });
    });

    it('should return 400 when entry point parameters does not match entry schema', async () => {
      const { body, status } = await request.post('/api/forge/jobs').send({
        ...requestParam,
        transactions: [
          {
            contractAddress: flexibleTokenContract,
            entryPoint: 'transfer',
            entryPointParams: {
              fakeParam: 5,
              destination: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
            },
          },
        ],
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'The given entry point params {"fakeParam":5,"destination":"tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw"} does not match the schema: {"destination":"address","tokens":"nat"}',
        status: 400,
      });
    });

    it('should return 400 when a map parameter does not match the map structure', async () => {
      const { body, status } = await request.post('/api/forge/jobs').send({
        ...requestParam,
        transactions: [
          {
            contractAddress: FA2Contract,
            entryPoint: 'mint',
            entryPointParams: {
              amount: 100,
              address: 'tz1iaJAxXAa5SCkdPBLA7f5Lj4LXS5vNa33E',
              token_id: 1,
              metadata: [
                {
                  name: '54686520546f6b656e204f6e65',
                },
              ],
            },
          },
        ],
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: '"metadata" does not match the structure of a map',
        status: 400,
      });
    });

    it('should return 404 when could not find the address', async () => {
      const getContractResponseSpy = jest
        .spyOn(tezosService, 'getContractResponse')
        .mockResolvedValue({} as any);

      const { body, status } = await request
        .post('/api/forge/jobs')
        .send(requestParam);

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: `Could not find the adress: ${testAccount}`,
        status: 404,
      });

      expect(getContractResponseSpy.mock.calls).toEqual([[testAccount]]);
    });

    it('should return 500 when unexpected error happen', async () => {
      const { body, status } = await request.post('/api/forge/jobs').send({
        ...requestParam,
        transactions: [
          {
            contractAddress: flexibleTokenContract,
            entryPoint: 'transfer',
            entryPointParams: {
              tokens: 'this is a token',
              destination: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
            },
          },
        ],
      });

      expect(status).toEqual(500);
      expect(body).toEqual({
        message: 'Internal Server Error',
        status: 500,
      });
    });

    it('should return 201 and correctly inserted data in the database', async () => {
      const { body, status } = await request
        .post('/api/forge/jobs')
        .send(requestParam);

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
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw"},{"int":"1"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"tokens":1,"destination":"tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw"}}}',
          amount: 0,
          fee: 2028,
          source: testAccount,
          storage_limit: 0,
          gas_limit: 17203,
          branch: insertedForgeParameters[0].branch,
          counter: insertedForgeParameters[0].counter,
          job_id: body.id,
        },
        {
          destination: flexibleTokenContract,
          parameters: '{"entrypoint":"lock","value":{"prim":"Unit"}}',
          parameters_json: '{"entrypoint":"lock","value":{"lock":0}}',
          amount: 0,
          fee: 1784,
          source: testAccount,
          storage_limit: 0,
          gas_limit: 14760,
          branch: insertedForgeParameters[1].branch,
          counter: insertedForgeParameters[1].counter,
          job_id: body.id,
        },
      ]);

      expect(insertedForgeParameters[0].branch).not.toBeNull();
      expect(insertedForgeParameters[0].counter).not.toBeNull();

      expect(insertedForgeParameters[1].branch).not.toBeNull();
      expect(insertedForgeParameters[1].counter).not.toBeNull();
    }, 8000);
  });
});
