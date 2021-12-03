import supertest from 'supertest';

import {
  postgreConfig,
  serverConfig,
  tezosNodeGranadaUrl,
} from '../../../../../__fixtures__/config';
import { resetTable, selectData } from '../../../../../__utils__/postgre';
import {
  activatedAccount,
  FA2Contract,
  FA2Contract7,
  flexibleTokenContract,
  revealedAccount,
  testAccount,
  testAccount2,
} from '../../../../../__fixtures__/smart-contract';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import { PostgreService } from '../../../../../../src/services/postgre';
import { TezosService } from '../../../../../../src/services/tezos';
import { ForgeOperationBodyParams } from '../../../../../../src/const/interfaces/forge-operation-params';
import { OpKind } from '@taquito/rpc';

describe('[processes/web/api/jobs] Forge job controller', () => {
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
    await resetTable(postgreService.pool, PostgreTables.OPERATIONS);
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
    const transaction = {
      contractAddress: flexibleTokenContract,
      entryPoint: 'transfer',
      entryPointParams: {
        tokens: 1,
        destination: testAccount2,
      },
    };
    const requestBodyParam: ForgeOperationBodyParams = {
      transactions: [
        transaction,
        {
          contractAddress: flexibleTokenContract,
          entryPoint: 'lock',
        },
      ],
      callerId: 'myCaller',
      sourceAddress: testAccount,
    };

    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request.post('/api/forge/jobs').send({
        sourceAddress: testAccount,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'transactions'",
        status: 400,
      });
    });

    it('should return 400 when there is an extra parameter in request param', async () => {
      const { body, status } = await request.post('/api/forge/jobs').send({
        ...requestBodyParam,
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
        ...requestBodyParam,
        transactions: [
          {
            contractAddress: FA2Contract7,
            entryPoint: 'transfer',
            entryPointParams: {
              tokens: 1,
              destination: testAccount2,
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
        ...requestBodyParam,
        transactions: [
          {
            contractAddress: flexibleTokenContract,
            entryPoint: 'transfer',
            entryPointParams: {
              fakeParam: 5,
              destination: testAccount2,
            },
          },
        ],
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'The given entry point params {"fakeParam":5,"destination":"' +
          testAccount2 +
          '"} does not match the schema: {"destination":"address","tokens":"nat"}',
        status: 400,
      });
    });

    it('should return 400 when a map parameter does not match the map structure', async () => {
      const { body, status } = await request.post('/api/forge/jobs').send({
        ...requestBodyParam,
        transactions: [
          {
            contractAddress: FA2Contract,
            entryPoint: 'mint',
            entryPointParams: {
              amount: 100,
              address: testAccount,
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

    it('should return 400 when reveal is false and the address is not revealed', async () => {
      const { body, status } = await request
        .post('/api/forge/jobs?reveal=false')
        .send({
          ...requestBodyParam,
          sourceAddress: activatedAccount.address,
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'Address tz1Z6MUWfJrsM2NLbLw9oWgxBeySULH8Lvhn is not revealed',
        status: 400,
      });
    });

    it("should return 400 when reveal is true and the address isn't related to the publicKey", async () => {
      const { body, status } = await request
        .post('/api/forge/jobs?reveal=true')
        .send({
          ...requestBodyParam,
          sourceAddress: activatedAccount.address,
          publicKey: revealedAccount.publicKey,
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'Ensure that the address tz1Z6MUWfJrsM2NLbLw9oWgxBeySULH8Lvhn is activated and is related to the public key edpkuJpbmRrKVbXHWmJAU5v9YKiA1PCiy1xo1UyAKeUjpSvkXM5wfe',
        status: 400,
      });
    });

    it('should return 400 when publicKey is undefined when reveal is true', async () => {
      const { body, status } = await request
        .post('/api/forge/jobs?reveal=true')
        .send({
          ...requestBodyParam,
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'publicKey should be defined when reveal is true',
        status: 400,
      });
    });

    it('should return 400 when number of transactions exceeds 5 with no reveal', async () => {
      const { body, status } = await request.post('/api/forge/jobs').send({
        transactions: [
          transaction,
          transaction,
          transaction,
          transaction,
          transaction,
          transaction,
        ],
        callerId: 'myCaller',
        sourceAddress: testAccount,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'Exceeded maximum number of operations per batch authorized (5)',
        status: 400,
      });
    });

    it('should return 404 when could not find the address', async () => {
      const getContractResponseSpy = jest
        .spyOn(tezosService, 'getContractResponse')
        .mockResolvedValue({} as any);

      const { body, status } = await request
        .post('/api/forge/jobs')
        .send(requestBodyParam);

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: `Could not find the adress: ${testAccount}`,
        status: 404,
      });

      expect(getContractResponseSpy.mock.calls).toEqual([[testAccount]]);
    });

    it('should return 500 when unexpected error happen', async () => {
      const { body, status } = await request.post('/api/forge/jobs').send({
        ...requestBodyParam,
        transactions: [
          {
            contractAddress: flexibleTokenContract,
            entryPoint: 'transfer',
            entryPointParams: {
              tokens: 'this is a token',
              destination: testAccount2,
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

    it('should return 201 when number of transactions equals 5 and reveal=true, but with address already revealed', async () => {
      const { body, status } = await request
        .post('/api/forge/jobs?reveal=true')
        .send({
          transactions: [
            transaction,
            transaction,
            transaction,
            transaction,
            transaction,
          ],
          callerId: 'myCaller',
          sourceAddress: testAccount,
          publicKey: revealedAccount.publicKey,
        });

      expect({ body, status }).toEqual({
        status: 201,
        body: {
          id: body.id,
          forged_operation: body.forged_operation,
          operation_hash: null,
          status: 'created',
          error_message: null,
          operation_kind: OpKind.TRANSACTION,
        },
      });
    });

    it('should return 201 when reveal is true and the address is already revealed', async () => {
      const { body, status } = await request
        .post('/api/forge/jobs?reveal=true')
        .send({
          ...requestBodyParam,
          publicKey: revealedAccount.publicKey,
        });

      expect({ body, status }).toEqual({
        status: 201,
        body: {
          id: body.id,
          forged_operation: body.forged_operation,
          operation_hash: null,
          status: 'created',
          error_message: null,
          operation_kind: OpKind.TRANSACTION,
        },
      });
    });

    it('should return 201 and correctly inserted data in the database', async () => {
      const { body, status } = await request
        .post('/api/forge/jobs')
        .send(requestBodyParam);

      expect({ body, status }).toEqual({
        status: 201,
        body: {
          id: body.id,
          forged_operation: body.forged_operation,
          operation_hash: null,
          status: 'created',
          error_message: null,
          operation_kind: OpKind.TRANSACTION,
        },
      });

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([body]);

      const insertedForgeParameters = await selectData(postgreService.pool, {
        tableName: PostgreTables.OPERATIONS,
        selectFields:
          'destination, parameters, parameters_json, amount, fee, source, storage_limit, gas_limit, counter, branch, job_id, caller_id',
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
          fee: 800,
          source: testAccount,
          storage_limit: 67,
          gas_limit: 4925,
          branch: insertedForgeParameters[0].branch,
          counter: insertedForgeParameters[0].counter,
          job_id: body.id,
          caller_id: 'myCaller',
        },
        {
          destination: flexibleTokenContract,
          parameters: '{"entrypoint":"lock","value":{"prim":"Unit"}}',
          parameters_json: '{"entrypoint":"lock","value":{"lock":0}}',
          amount: 0,
          fee: 621,
          source: testAccount,
          storage_limit: 0,
          gas_limit: 3131,
          branch: insertedForgeParameters[1].branch,
          counter: insertedForgeParameters[1].counter,
          job_id: body.id,
          caller_id: 'myCaller',
        },
      ]);

      expect(insertedForgeParameters[0].branch).not.toBeNull();
      expect(insertedForgeParameters[0].counter).not.toBeNull();

      expect(insertedForgeParameters[1].branch).not.toBeNull();
      expect(insertedForgeParameters[1].counter).not.toBeNull();
    }, 8000);
  });
});
