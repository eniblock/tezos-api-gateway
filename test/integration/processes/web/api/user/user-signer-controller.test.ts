import supertest from 'supertest';
import nock from 'nock';
import { WebProcess } from '../../../../../../src/processes/web/web-process';
import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';
import * as UserSigner from '../../../../../../src/lib/user/sign-data';

describe('[processes/web/api/user] User signer controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);

  webProcess.postgreService = postgreService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  describe('#UserSigner', () => {
    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request
        .post('/api/user/userId/sign')
        .send({});

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'bytesToSign'",
        status: 400,
      });
    });

    it('should return 400 when there is extra parameter', async () => {
      const { body, status } = await request
        .post('/api/user/userId/sign')
        .send({
          bytesToSign: '0x00',
          extra: 'extra',
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.body should NOT have additional properties',
        status: 400,
      });
    });

    it("should return 404 when the user doesn't exist", async () => {
      const vaultNock = nock('http://localhost:8300')
        .get(`/v1/transit/keys/userId`)
        .reply(404, {
          errors: [],
        });

      const { body, status } = await request
        .post('/api/user/userId/sign')
        .send({ bytesToSign: '0x00' });

      vaultNock.done();

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: "Not found : userId doesn't exist in Vault",
        status: 404,
      });
    });

    it('should return 200, and sign the data when the request is valid', async () => {
      const vaultNockGetUser = nock('http://localhost:8300')
        .get(`/v1/transit/keys/userId`)
        .reply(200, {});

      const vaultSignerResponseSpy = jest
        .spyOn(UserSigner, 'signData')
        .mockResolvedValue({
          signature:
            'edsigtcTjLrTq1V2sLprMzxSZbkChaFnuUjiobQ5P7WQb3N2yjsTaomrA3pc9jnEfFmegcCBpQ3FUXXEJXNSebhaUjcS51KJRdw',
          signedData: '001122334455',
        } as any);

      const { body, status } = await request
        .post('/api/user/userId/sign')
        .send({ bytesToSign: '0x00' });

      vaultNockGetUser.done();
      expect(vaultSignerResponseSpy.mock.calls).toEqual([
        ['userId', '0x00', false],
      ]);

      expect(status).toEqual(200);
      expect(body.signedData).toEqual('001122334455');
      expect(body.signature).toEqual(
        'edsigtcTjLrTq1V2sLprMzxSZbkChaFnuUjiobQ5P7WQb3N2yjsTaomrA3pc9jnEfFmegcCBpQ3FUXXEJXNSebhaUjcS51KJRdw',
      );
    });

    it('should return 200, and sign the data appended with operation prefix when the parameter operationPrefix is true', async () => {
      const vaultNockGetUser = nock('http://localhost:8300')
        .get(`/v1/transit/keys/userId`)
        .reply(200, {});

      const vaultSignerResponseSpy = jest
        .spyOn(UserSigner, 'signData')
        .mockResolvedValue({
          signature:
            'edsigtcTjLrTq1V2sLprMzxSZbkChaFnuUjiobQ5P7WQb3N2yjsTaomrA3pc9jnEfFmegcCBpQ3FUXXEJXNSebhaUjcS51KJRdw',
          signedData: '001122334455',
        } as any);

      const { body, status } = await request
        .post('/api/user/userId/sign')
        .query({ operationPrefix: true })
        .send({ bytesToSign: '0x00' });

      vaultNockGetUser.done();
      expect(vaultSignerResponseSpy.mock.calls).toEqual([
        ['userId', '0x00', true],
      ]);

      expect(status).toEqual(200);
      expect(body.signedData).toEqual('001122334455');
      expect(body.signature).toEqual(
        'edsigtcTjLrTq1V2sLprMzxSZbkChaFnuUjiobQ5P7WQb3N2yjsTaomrA3pc9jnEfFmegcCBpQ3FUXXEJXNSebhaUjcS51KJRdw',
      );
    });
  });
});
