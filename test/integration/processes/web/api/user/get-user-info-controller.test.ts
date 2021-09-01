import supertest from 'supertest';
import nock from 'nock';

import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { PostgreService } from '../../../../../../src/services/postgre';
import { testAccount } from '../../../../../__fixtures__/smart-contract';
import expectExtendFunctions from '../../../../../__utils__/expect-extend';

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
          'request.params.address should match pattern "^[0-9a-zA-Z]{36}$"',
        status: 400,
      });
    });

    it('Should return 400 when the address does not exist', async () => {
      const { body, status } = await request.get(
        '/api/user/info/tz1hdQscorfqMzFqYxnrApuS5i6QSTuoAp3a',
      );

      expect(status).toEqual(404);
      expect(body).toEqual({
        message:
          'Could not find an user with this address: tz1hdQscorfqMzFqYxnrApuS5i6QSTuoAp3a',
        status: 404,
      });
    });

    it('Should return 200 and the user information with a good address', async () => {
      const { body, status } = await request.get(
        `/api/user/info/${testAccount}`,
      );

      expect(status).toEqual(200);
      expect.extend(expectExtendFunctions());
      expect(body).toMatchObject({
        account: testAccount,
        balance: expect.any(Number),
        revealed: (expect as any).toBeTypeOrNull(Boolean),
      });
    });
  });
});
