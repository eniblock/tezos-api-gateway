import supertest from 'supertest';
import nock from 'nock';

import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { PostgreService } from '../../../../../../src/services/postgre';
import {
  activatedAccount,
  contractWithTokenBalance,
  nonValidContract,
  unActivatedAccount,
} from '../../../../../__fixtures__/smart-contract';

describe('[processes/web/api/user] Create user controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);

  webProcess.postgreService = postgreService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#createUser', () => {
    it('Should return 404 when a required parameter is missing', async () => {
      const { body, status } = await request.get('/api/user/info/');

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: 'not found',
        status: 404,
      });
    });

    it('Should return 400 when the address does not have a good format', async () => {
      const { body, status } = await request.get('/api/user/info/fakeFormat');

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.params.address should match pattern "^tz+[0-9a-zA-Z]{34}$",' +
          ' request.params.address should match pattern "^KT+[0-9a-zA-Z]{34}$",' +
          ' request.params.address should match exactly one schema in oneOf',
        status: 400,
      });
    });

    it('Should return 200 when the address does not exist', async () => {
      const { body, status } = await request.get(
        `/api/user/info/${unActivatedAccount.address}`,
      );

      expect(status).toEqual(200);
      expect(body).toEqual({
        account: unActivatedAccount.address,
        balance: 0,
        revealed: false,
        activated: false,
      });
    });

    it('Should return 200 when the contract address does not exist', async () => {
      const { body, status } = await request.get(
        `/api/user/info/${nonValidContract}`,
      );

      expect(status).toEqual(200);
      expect(body).toEqual({
        account: nonValidContract,
        balance: 0,
      });
    });

    it('Should return 200 and the user information with a good address', async () => {
      const { body, status } = await request.get(
        `/api/user/info/${activatedAccount.address}`,
      );

      expect(status).toEqual(200);
      expect(body).toMatchObject({
        account: activatedAccount.address,
        revealed: false,
        activated: true,
      });
    });

    it('Should return 200 and the contract balance for a valid contract address', async () => {
      const { body, status } = await request.get(
        `/api/user/info/${contractWithTokenBalance}`,
      );

      expect(status).toEqual(200);
      expect(body).toEqual({
        account: contractWithTokenBalance,
        balance: 223,
      });
    });
  });
});
