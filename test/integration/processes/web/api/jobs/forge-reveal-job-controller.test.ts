import supertest from 'supertest';

import {
  postgreConfig,
  serverConfig,
  tezosNodeUrl,
} from '../../../../../__fixtures__/config';
import { resetTable, selectData } from '../../../../../__utils__/postgre';
import {
  activatedAccount,
  revealedAccount,
  unActivatedAccount,
} from '../../../../../__fixtures__/smart-contract';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import { PostgreService } from '../../../../../../src/services/postgre';
import { TezosService } from '../../../../../../src/services/tezos';
import { OpKind } from '@taquito/rpc';
import * as jobsLib from '../../../../../../src/lib/jobs/forge-reveal-operation';
import { ForgeRevealOperationParams } from '../../../../../../src/const/interfaces/forge-reveal-operation-params';

describe('[processes/web/api] Forge Reveal job controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeUrl);

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

  describe('#forgeRevealOperationAndCreateJob', () => {
    const requestBodyParam: ForgeRevealOperationParams = {
      address: activatedAccount.address,
      publicKey: activatedAccount.publicKey,
      callerId: 'myCaller',
    };

    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request.post('/api/forge/reveal').send({
        address: activatedAccount.address,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'publicKey'",
        status: 400,
      });
    });

    it('should return 400 when there is an extra parameter in request param', async () => {
      const { body, status } = await request.post('/api/forge/reveal').send({
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
      const { body, status } = await request.post('/api/forge/reveal').send({
        ...requestBodyParam,
        address: 'bad_formatted_address',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.body.address should match pattern "^tz+[0-9a-zA-Z]{34}$"',
        status: 400,
      });
    });

    it('should return 400 when address is not activated', async () => {
      const { body, status } = await request.post('/api/forge/reveal').send({
        address: unActivatedAccount.address,
        publicKey: unActivatedAccount.publicKey,
        callerId: 'myCaller',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: `Ensure that the address ${unActivatedAccount.address} is activated and is related to the public key ${unActivatedAccount.publicKey}`,
        status: 400,
      });
    });

    it('should return 400 when public key does not match the address', async () => {
      const { body, status } = await request.post('/api/forge/reveal').send({
        address: unActivatedAccount.address,
        publicKey: revealedAccount.publicKey,
        callerId: 'myCaller',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: `Ensure that the address ${unActivatedAccount.address} is activated and is related to the public key ${revealedAccount.publicKey}`,
        status: 400,
      });
    });

    it('should return 400 when fee parameters is set to zero', async () => {
      const { body, status } = await request.post('/api/forge/reveal').send({
        ...requestBodyParam,
        fee: 0,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.body.fee should be >= 1',
        status: 400,
      });
    });

    it('should return 500 when unexpected error happen', async () => {
      jest
        .spyOn(jobsLib, 'forgeRevealOperation')
        .mockRejectedValue(new Error('Unexpected error'));

      const { body, status } = await request.post('/api/forge/reveal').send({
        ...requestBodyParam,
      });

      expect(status).toEqual(500);
      expect(body).toEqual({
        message: 'Internal Server Error',
        status: 500,
      });
    });

    it('should return 201 and correctly inserted data in the database', async () => {
      const { body, status } = await request
        .post('/api/forge/reveal')
        .send(requestBodyParam);

      const { gas, fee, ...job } = body;

      expect({ body, status }).toEqual({
        status: 201,
        body: {
          id: body.id,
          forged_operation: body.forged_operation,
          operation_hash: null,
          status: 'created',
          error_message: null,
          operation_kind: OpKind.REVEAL,
          fee,
          gas,
        },
      });

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([job]);

      const insertedForgeParameters = await selectData(postgreService.pool, {
        tableName: PostgreTables.OPERATIONS,
        selectFields:
          'destination, parameters, parameters_json, amount, fee, source, storage_limit, gas_limit, counter, branch, job_id, caller_id',
      });

      expect(insertedForgeParameters).toMatchObject([
        {
          fee: 374,
          destination: '',
          parameters: null,
          parameters_json: null,
          amount: null,
          source: activatedAccount.address,
          storage_limit: 0,
          gas_limit: 1100,
          branch: insertedForgeParameters[0].branch,
          counter: insertedForgeParameters[0].counter,
          job_id: body.id,
          caller_id: 'myCaller',
        },
      ]);

      expect(insertedForgeParameters[0].branch).not.toBeNull();
      expect(insertedForgeParameters[0].counter).not.toBeNull();
    }, 8000);

    it('should return 201 and correctly insert data in the database fee parameter is specified', async () => {
      const { body, status } = await request.post('/api/forge/reveal').send({
        ...requestBodyParam,
        fee: 500,
      });

      const { gas, fee, ...job } = body;

      expect({ body, status }).toEqual({
        status: 201,
        body: {
          id: body.id,
          forged_operation: body.forged_operation,
          operation_hash: null,
          status: 'created',
          error_message: null,
          operation_kind: OpKind.REVEAL,
          fee,
          gas,
        },
      });

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([job]);

      const insertedForgeParameters = await selectData(postgreService.pool, {
        tableName: PostgreTables.OPERATIONS,
        selectFields:
          'destination, parameters, parameters_json, amount, fee, source, storage_limit, gas_limit, counter, branch, job_id, caller_id',
      });

      expect(insertedForgeParameters[0].fee).toEqual(500);
    }, 8000);
  });
});
