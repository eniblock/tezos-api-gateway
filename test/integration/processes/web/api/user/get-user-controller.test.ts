import supertest from 'supertest';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import * as getUserAccountLib from '../../../../../../src/lib/user/get-user-account';

import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';
import nock from 'nock';

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
        userIdList: ['key1', 'key2'],
      });

      expect(status).toEqual(500);
      expect(body).toEqual({
        message: 'Internal Server Error',
        status: 500,
      });
    });

    it('should return 200 and the account addresses of the specified users ', async () => {
      const vaultNock1 = nock('http://localhost:8300')
        .get(`/v1/transit/keys/key1`)
        .reply(200, {
          request_id: '4e171bc2-6df7-7dab-b10b-d100efca7080',
          lease_id: '',
          lease_duration: 0,
          renewable: false,
          data: {
            allow_plaintext_backup: false,
            deletion_allowed: false,
            derived: false,
            exportable: true,
            keys: {
              '1': {
                creation_time: '2021-02-01T10:01:29.097094+01:00',
                name: 'ed25519',
                public_key: 'ajwQQUHP/JZ74hoG3UoF+k/9EJPi33/ynxCxubcwYWM=',
              },
            },
            latest_version: 1,
            min_available_version: 0,
            min_decryption_version: 1,
            min_encryption_version: 0,
            name: 'key1',
            supports_decryption: false,
            supports_derivation: true,
            supports_encryption: false,
            supports_signing: true,
            type: 'ed25519',
          },
          warnings: null,
        });
      const vaultNock2 = nock('http://localhost:8300')
        .get(`/v1/transit/keys/key2`)
        .reply(200, {
          request_id: 'e23cae93-c44d-a812-64a4-9ff10b94b5ce',
          lease_id: '',
          lease_duration: 0,
          renewable: false,
          data: {
            allow_plaintext_backup: false,
            deletion_allowed: false,
            derived: false,
            exportable: true,
            keys: {
              '1': {
                creation_time: '2021-02-01T10:01:29.097094+01:00',
                name: 'ed25519',
                public_key: 'jyyitbZRY3kxwCk4+kzfOB6rHYnxBxmLdkAqY3hxArc=',
              },
            },
            latest_version: 1,
            min_available_version: 0,
            min_decryption_version: 1,
            min_encryption_version: 0,
            name: 'key2',
            supports_decryption: false,
            supports_derivation: true,
            supports_encryption: false,
            supports_signing: true,
            type: 'ed25519',
          },
          warnings: null,
        });

      const { body, status } = await request.get('/api/user').query({
        userIdList: ['key1', 'key2'],
      });

      vaultNock1.done();
      vaultNock2.done();

      expect(status).toEqual(200);
      expect(body[0].userId).toEqual('key1');
      expect(body[0].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      expect(body[1].userId).toEqual('key2');
      expect(body[1].account).toMatch(/tz[0-9a-zA-Z]{34}/);
    });

    it('should return 200 and a null account address for an unknown user Id ', async () => {
      const vaultNock1 = nock('http://localhost:8300')
        .get(`/v1/transit/keys/key1`)
        .reply(200, {
          request_id: '4e171bc2-6df7-7dab-b10b-d100efca7080',
          lease_id: '',
          lease_duration: 0,
          renewable: false,
          data: {
            allow_plaintext_backup: false,
            deletion_allowed: false,
            derived: false,
            exportable: true,
            keys: {
              '1': {
                creation_time: '2021-02-01T10:01:29.097094+01:00',
                name: 'ed25519',
                public_key: 'ajwQQUHP/JZ74hoG3UoF+k/9EJPi33/ynxCxubcwYWM=',
              },
            },
            latest_version: 1,
            min_available_version: 0,
            min_decryption_version: 1,
            min_encryption_version: 0,
            name: 'key1',
            supports_decryption: false,
            supports_derivation: true,
            supports_encryption: false,
            supports_signing: true,
            type: 'ed25519',
          },
          warnings: null,
        });
      const vaultNock3 = nock('http://localhost:8300')
        .get(`/v1/transit/keys/key3`)
        .reply(404);

      const { body, status } = await request.get('/api/user').query({
        userIdList: ['key1', 'key3'],
      });

      vaultNock1.done();
      vaultNock3.done();

      expect(status).toEqual(200);
      expect(body[0].userId).toEqual('key1');
      expect(body[0].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      expect(body[1].userId).toEqual('key3');
      expect(body[1].account).toEqual(null);
    });
  });
});
