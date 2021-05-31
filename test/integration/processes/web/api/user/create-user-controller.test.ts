import supertest from 'supertest';
import nock from 'nock';

import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { resetTable } from '../../../../../__utils__/postgre';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import { PostgreService } from '../../../../../../src/services/postgre';
import * as userLib from '../../../../../../src/lib/user/create-account';

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

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.TRANSACTION);
    await resetTable(postgreService.pool, PostgreTables.JOBS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#createUser', () => {
    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request.post('/api/user/create').send({
        secureKeyName: 'toto',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'userIdList'",
        status: 400,
      });
    });

    it('should return 400 when there is extra parameter', async () => {
      const { body, status } = await request.post('/api/user/create').send({
        secureKeyName: 'toto',
        userIdList: ['key1', 'key2'],
        extra: 'extra',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.body should NOT have additional properties',
        status: 400,
      });
    });

    it('should return 404 when vault signer return 404', async () => {
      jest.spyOn(userLib, 'createVaultKeys').mockImplementation();

      const vaultNock = nock('http://localhost:8300')
        .get(`/v1/transit/keys/nonExistingKey`)
        .reply(404, {
          errors: 'NOT FOUND',
        });

      const { body, status } = await request.post('/api/user/create').send({
        secureKeyName: 'nonExistingKey',
        userIdList: ['key1', 'key2'],
      });

      vaultNock.done();

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: '{"errors":"NOT FOUND"}',
        status: 404,
      });
    });

    describe('the secure key is in vault list', () => {
      it('should return 500 when unexpected error happen', async () => {
        jest
          .spyOn(userLib, 'createAccounts')
          .mockRejectedValue(new Error('Unexpected error'));

        const { body, status } = await request.post('/api/user/create').send({
          secureKeyName: 'toto',
          userIdList: ['key1', 'key2'],
        });

        expect(status).toEqual(500);
        expect(body).toEqual({
          message: 'Internal Server Error',
          status: 500,
        });
      });

      it('should return 201 and the list of user account addresses when the request is valid', async () => {
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

        jest
          .spyOn(userLib, 'createTezosAccountsByVaultKeys')
          .mockImplementation();

        jest.spyOn(userLib, 'createVaultKeys').mockImplementation();

        jest.spyOn(userLib, 'saveUserIdByAddresses').mockImplementation();

        const { body, status } = await request.post('/api/user/create').send({
          secureKeyName: 'toto',
          userIdList: ['key1', 'key2'],
        });

        vaultNock1.done();
        vaultNock2.done();

        expect(status).toEqual(201);
        expect(body[0].userId).toEqual('key1');
        expect(body[0].account).toMatch(/tz[0-9a-zA-Z]{34}/);
        expect(body[1].userId).toEqual('key2');
        expect(body[1].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      });
    });
  });
});
