import supertest from 'supertest';
import { WebProcess } from '../../../../../../src/processes/web/web-process';
import {
  postgreConfig,
  serverConfig,
  tezosNodeEdonetUrl,
} from '../../../../../__fixtures__/config';
import { TezosService } from '../../../../../../src/services/tezos';
import { PostgreService } from '../../../../../../src/services/postgre';

describe('[processes/web/api/storage] Deploy Contract Controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const tezosService = new TezosService(tezosNodeEdonetUrl);
  const postgreService = new PostgreService(postgreConfig);

  webProcess.postgreService = postgreService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
  });

  beforeEach(() => {
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

  describe('#compileAndDeployContract', () => {
    it('Should return 400 when secureKeyName or smarContractCode has unexpected values', async () => {
      const { body, status } = await request
        .post('/api/tezos_node/contract/deploy')
        .set('Content-Type', 'application/json')
        .send({
          secureKeyName: 'nothing',
          smartContractCode: 'nothing',
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'smartpysh failed to compile, check the description of the prop smartContractCode in const/openapi or try to compile with SmartPy cli',
        status: 400,
      });
    });

    it('Should return 400 when secureKeyName has unexpected value and smartContractCode is correct', async () => {
      const { body, status } = await request
        .post('/api/tezos_node/contract/deploy')
        .set('Content-Type', 'application/json')
        .send({
          secureKeyName: 'nothing',
          smartContractCode:
            'aW1wb3J0IHNtYXJ0cHkgYXMgc3AKCmNsYXNzIENvdW50ZXIoc3AuQ29udHJhY3QpOgoKICAgIGRlZiBfX2luaXRfXyhzZWxmLCBpbml0aWFsVmFsKToKICAgICAgICBzZWxmLmluaXQoCiAgICAgICAgICAgIHZhbHVlID0gaW5pdGlhbFZhbAogICAgICAgICkKCiAgICBkZWYgaW5jcmVtZW50KHNlbGYsIGFtb3VudCk6CiAgICAgICAgc2VsZi5kYXRhLnZhbHVlICs9IGFtb3VudAoKCiAgICBkZWYgZGVjcmVtZW50KHNlbGYsIGFtb3VudCk6CiAgICAgICAgc2VsZi5kYXRhLnZhbHVlIC09IGFtb3VudAoKCgpAc3AuYWRkX3Rlc3QobmFtZSA9ICJDb3VudGVyIikKZGVmIHRlc3QoKToKICAgIHNjZW5hcmlvID0gc3AudGVzdF9zY2VuYXJpbygpCgogICAgY291bnRlciA9IENvdW50ZXIoNSkKICAgIHNjZW5hcmlvICs9IGNvdW50ZXIKICAgIHNwLmFkZF9jb21waWxhdGlvbl90YXJnZXQoJ2NvdW50ZXIgdGFyZ2V0JywgQ291bnRlcigyKSkK',
        });

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: 'Error while fetching publique key with the key name: nothing',
        status: 404,
      });
    });

    it('Should return 200 when secureKeyName is correct and smartContractCode is correct', async () => {
      jest.spyOn(tezosService, 'deployContract').mockResolvedValue({
        operation_hash: 'operation_hash',
        contract_address: 'contract_address',
      });

      const { body, status } = await request
        .post('/api/tezos_node/contract/deploy')
        .set('Content-Type', 'application/json')
        .send({
          secureKeyName: 'admin',
          smartContractCode:
            'aW1wb3J0IHNtYXJ0cHkgYXMgc3AKCmNsYXNzIENvdW50ZXIoc3AuQ29udHJhY3QpOgoKICAgIGRlZiBfX2luaXRfXyhzZWxmLCBpbml0aWFsVmFsKToKICAgICAgICBzZWxmLmluaXQoCiAgICAgICAgICAgIHZhbHVlID0gaW5pdGlhbFZhbAogICAgICAgICkKCiAgICBkZWYgaW5jcmVtZW50KHNlbGYsIGFtb3VudCk6CiAgICAgICAgc2VsZi5kYXRhLnZhbHVlICs9IGFtb3VudAoKCiAgICBkZWYgZGVjcmVtZW50KHNlbGYsIGFtb3VudCk6CiAgICAgICAgc2VsZi5kYXRhLnZhbHVlIC09IGFtb3VudAoKCgpAc3AuYWRkX3Rlc3QobmFtZSA9ICJDb3VudGVyIikKZGVmIHRlc3QoKToKICAgIHNjZW5hcmlvID0gc3AudGVzdF9zY2VuYXJpbygpCgogICAgY291bnRlciA9IENvdW50ZXIoNSkKICAgIHNjZW5hcmlvICs9IGNvdW50ZXIKICAgIHNwLmFkZF9jb21waWxhdGlvbl90YXJnZXQoJ2NvdW50ZXIgdGFyZ2V0JywgQ291bnRlcigyKSkK',
        });

      expect(status).toEqual(201);
      expect(body).toEqual({
        operation_hash: 'operation_hash',
        contract_address: 'contract_address',
      });
    });
  });
});
