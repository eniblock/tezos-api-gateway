import supertest from 'supertest';
import nock from 'nock';

import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { testAccount } from '../../../../../__fixtures__/smart-contract';
import { PostgreService } from '../../../../../../src/services/postgre';

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
    nock.cleanAll();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#addUserWithPublicKey', () => {
    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request.post('/api/user/add').send({
        userId: 'toto',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'publicKey'",
        status: 400,
      });
    });
  });

  it('should return 400 when there is extra parameter', async () => {
    const { body, status } = await request.post('/api/user/add').send({
      userId: 'toto',
      publicKey: testAccount,
      extra: 'extra',
    });

    expect(status).toEqual(400);
    expect(body).toEqual({
      message: 'request.body should NOT have additional properties',
      status: 400,
    });
  });

  it('should return 201 and give back userId, publicKey when the secret has been stored', async () => {
    const vaultNock = nock('http://localhost:8300')
      .post('/v1/secret/data/self-managed/toto')
      .reply(201);

    const { body, status } = await request.post('/api/user/add').send({
      userId: 'toto',
      publicKey: testAccount,
    });

    vaultNock.done();

    expect(status).toEqual(201);
    expect(body).toEqual({
      userId: 'toto',
      publicKey: testAccount,
    });
  });
});
