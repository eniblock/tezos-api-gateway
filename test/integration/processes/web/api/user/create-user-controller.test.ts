import supertest from 'supertest';
import nock from 'nock';

import {
  amqpConfig,
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { resetTable } from '../../../../../__utils__/postgre';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import { PostgreService } from '../../../../../../src/services/postgre';
import * as userLib from '../../../../../../src/lib/user/create-account';
import { AmqpService } from '../../../../../../src/services/amqp';
import { logger } from '../../../../../__fixtures__/services/logger';
import { VaultClient } from '../../../../../../src/services/clients/vault-client';
import { vaultClientConfig } from '../../../../../../src/config';
import { TezosService } from '../../../../../../src/services/tezos';
import { VaultSigner } from '../../../../../../src/services/signers/vault';

describe('[processes/web/api/user] Create user controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);
  const amqpService = new AmqpService(amqpConfig, logger);

  webProcess.postgreService = postgreService;
  webProcess.amqpService = amqpService;

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
        userIdList: ['user1', 'user2'],
        extra: 'extra',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.body should NOT have additional properties',
        status: 400,
      });
    });

    it('should return 404 when vault signer return 404', async () => {
      const { body, status } = await request.post('/api/user/create').send({
        secureKeyName: 'nonExistantKey',
        userIdList: ['user1', 'user2'],
      });

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: '{"errors":[]}',
        status: 404,
      });
    });

    describe('the secure key is in vault list', () => {
      beforeAll(async () => {
        const vaultClient = new VaultClient(vaultClientConfig, logger);
        await vaultClient.createKey('toto');
      });

      beforeEach(async () => {
        jest
          .spyOn(userLib, 'createTezosAccountsByVaultKeys')
          .mockImplementation(
            async (
              tezosService: TezosService,
              signer: VaultSigner,
              vaultKeys: string[],
            ) => {
              logger.info(
                { tezosService, signer, vaultKeys },
                '[test/lib/user/createTezosAccountsByVaultKeys] mocking the createTezosAccountsByVaultKeys function',
              );
            },
          );
      });

      it('should return 500 when unexpected error happen', async () => {
        jest
          .spyOn(userLib, 'createAccounts')
          .mockRejectedValue(new Error('Unexpected error'));

        const { body, status } = await request.post('/api/user/create').send({
          secureKeyName: 'toto',
          userIdList: ['user1', 'user2'],
        });

        expect(status).toEqual(500);
        expect(body).toEqual({
          message: 'Internal Server Error',
          status: 500,
        });
      });

      it('should return 201 and the list of user account addresses when the request is valid', async () => {
        const { body, status } = await request.post('/api/user/create').send({
          secureKeyName: 'toto',
          userIdList: ['user1', 'user2'],
        });

        expect(status).toEqual(201);
        expect(body[0].userId).toEqual('user1');
        expect(body[0].account).toMatch(/tz[0-9a-zA-Z]{34}/);
        expect(body[1].userId).toEqual('user2');
        expect(body[1].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      });
    });
  });
});
