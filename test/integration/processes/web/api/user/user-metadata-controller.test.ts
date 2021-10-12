import supertest from 'supertest';
import nock from 'nock';
import { WebProcess } from '../../../../../../src/processes/web/web-process';
import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';

describe('[processes/web/api/user] User metadata controller', () => {
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

  afterAll(async () => {
    await webProcess.stop();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  describe('#createUpdateUserMetadata', () => {
    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request
        .post('/api/user/userId/metadata')
        .send({});

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'data'",
        status: 400,
      });
    });

    it('should return 400 when there is extra parameter', async () => {
      const { body, status } = await request
        .post('/api/user/userId/metadata')
        .send({
          data: 'test',
          extra: 'extra',
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.body should NOT have additional properties',
        status: 400,
      });
    });

    it("should return 404 when the user doesn't exist", async () => {
      const { body, status } = await request
        .post('/api/user/userId/metadata')
        .send({ data: 'test' });

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: "Not found : userId doesn't exist in Vault",
        status: 404,
      });
    });

    it('should return 201, the userId of user account and the data when the request is valid', async () => {
      const vaultNockGetUser = nock('http://localhost:8300')
        .get(`/v1/transit/keys/userId`)
        .reply(200, {});

      const vaultNockSetSecret = nock('http://localhost:8300')
        .post(`/v1/secret/data/metadata/userId`)
        .reply(201, {});

      const { body, status } = await request
        .post('/api/user/userId/metadata')
        .send({
          data: 'test',
        });

      vaultNockGetUser.done();
      vaultNockSetSecret.done();

      expect(status).toEqual(201);
      expect(body.userId).toEqual('userId');
      expect(body.data).toEqual('test');
    });
  });

  describe('#getUserMetadata', () => {
    it("should return 404 when the user doesn't exist", async () => {
      const { body, status } = await request.get('/api/user/userId/metadata');

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: "Not found : secret userId doesn't exist in Vault",
        status: 404,
      });
    });

    it('should return 201, the userId of user account and the data when the request is valid', async () => {
      const vaultNockGetSecret = nock('http://localhost:8300')
        .get(`/v1/secret/data/metadata/userId`)
        .reply(200, {
          request_id: 'a64fc7d3-a2d8-0c2f-287f-8101dd95c86f',
          data: {
            data: {
              metadata: 'test',
            },
            metadata: {
              created_time: '2021-10-12T07:10:33.941079434Z',
              deletion_time: '',
              destroyed: false,
              version: 1,
            },
          },
        });

      const { body, status } = await request
        .get('/api/user/userId/metadata')
        .send();

      vaultNockGetSecret.done();

      expect(status).toEqual(200);
      expect(body).toEqual({
        data: 'test',
      });
    });
  });

  describe('#deleteUserMetadata', () => {
    it("should return 404 when the user doesn't exist", async () => {
      const { body, status } = await request.get('/api/user/userId/metadata');

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: "Not found : secret userId doesn't exist in Vault",
        status: 404,
      });
    });
  });
});
