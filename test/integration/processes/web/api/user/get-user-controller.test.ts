import supertest from 'supertest';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
// import { logger } from '../../../../../../src/services/logger';
import * as getUserAccountLib from '../../../../../../src/lib/user/get-user-account';

import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';
import { VaultClient } from '../../../../../../src/services/clients/vault-client';
import { vaultClientConfig } from '../../../../../../src/config';
import { logger } from '../../../../../__fixtures__/services/logger';

describe('[processes/web/api/user] Get User Account Controller', () => {
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
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#getUserController', () => {
    beforeAll(async () => {
      const vaultClient = new VaultClient(vaultClientConfig, logger);
      await vaultClient.createKey('user1');
      await vaultClient.createKey('user2');
    });

    it('should return 400 when the query parameter userIdList is missing', async () => {
      const { body, status } = await request.get('/api/user');

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.query should have required property 'userIdList'",
        status: 400,
      });
    });

    it('should return 500 when unexpected error happen', async () => {
      jest
        .spyOn(getUserAccountLib, 'getUserAccounts')
        .mockRejectedValue(new Error());

      const { body, status } = await request.get('/api/user').query({
        userIdList: ['user1', 'user2'],
      });

      expect(status).toEqual(500);
      expect(body).toEqual({
        message: 'Internal Server Error',
        status: 500,
      });
    });

    it('should return 200 and the account addresses of the specified users ', async () => {
      const { body, status } = await request.get('/api/user').query({
        userIdList: ['user1', 'user2'],
      });

      expect(status).toEqual(200);
      expect(body[0].userId).toEqual('user1');
      expect(body[0].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      expect(body[1].userId).toEqual('user2');
      expect(body[1].account).toMatch(/tz[0-9a-zA-Z]{34}/);
    });

    it('should return 200 and a null account address for an unknown user Id ', async () => {
      const { body, status } = await request.get('/api/user').query({
        userIdList: ['user1', 'user3'],
      });

      expect(status).toEqual(200);
      expect(body[0].userId).toEqual('user1');
      expect(body[0].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      expect(body[1].userId).toEqual('user3');
      expect(body[1].account).toEqual(null);
    });
  });
});
