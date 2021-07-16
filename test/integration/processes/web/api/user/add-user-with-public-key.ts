import supertest from 'supertest';
import nock from 'nock';

import { serverConfig } from '../../../../../__fixtures__/config';
import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { testAccount } from '../../../../../__fixtures__/smart-contract';
import * as userLib from '../../../../../../src/lib/user/create-account';

describe('[processes/web/api/user] Create user controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
  });

  // beforeEach(async () => {});

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('should return 400 when the publicKey has not a good format', async () => {
    const { body, status } = await request.post('/api/user/add').send({
      userId: 'toto',
      publicKey: 'fake public key',
    });

    expect(status).toEqual(400);
    expect(body).toEqual({
      message:
        'request.body.publicKey should match pattern "^[0-9a-zA-Z]{36}$"',
      status: 400,
    });
  });

  it('should return 201 and give back userId, publicKey | when the secret has been stored', async () => {
    jest.spyOn(userLib, 'createVaultKeys').mockImplementation();

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