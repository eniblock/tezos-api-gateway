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
    await webProcess.amqpService.channel.waitForConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#updateUserKeys', () => {
    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request
        .patch('/api/user/update-wallet')
        .send({
          userId: 'tata',
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'publicKey'",
        status: 400,
      });
    });
  });

  it('should return 400 when there is extra parameter', async () => {
    const { body, status } = await request
      .patch('/api/user/update-wallet')
      .send({
        userId: 'tata',
        publicKey: testAccount,
        extra: 'extra',
      });

    expect(status).toEqual(400);
    expect(body).toEqual({
      message: 'request.body should NOT have additional properties',
      status: 400,
    });
  });

  it('should return 204 and should return nothing', async () => {
    const vaultNock = nock('http://localhost:8300')
      .get('/v1/secret/data/self-managed/tata')
      .reply(201, {
        data: {
          data: {
            publicKey: testAccount,
          },
        },
      });
    const vaultNock2 = nock('http://localhost:8300')
      .post('/v1/secret/data/self-managed/tata')
      .reply(201, {
        data: '',
      });

    const { status } = await request.patch('/api/user/update-wallet').send({
      userId: 'tata',
      publicKey: testAccount,
    });

    vaultNock.done();
    vaultNock2.done();

    expect(status).toEqual(204);
  });

  it('Should return 204 and should return nothing', async () => {
    const vaultNock = nock('http://localhost:8300')
      .intercept('/v1/transit/keys', 'LIST')
      .reply(201, {
        data: {
          keys: ['tata'],
        },
      });
    const vaultNock2 = nock('http://localhost:8300')
      .post('/v1/transit/keys/tata/rotate')
      .reply(201);

    const { status } = await request
      .patch('/api/user/update-delegated-wallets')
      .send();

    vaultNock.done();
    vaultNock2.done();

    expect(status).toEqual(204);
  });
});
