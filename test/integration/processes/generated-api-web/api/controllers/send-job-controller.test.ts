import supertest from 'supertest';
import nock from 'nock';

import {
  amqpConfig,
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { logger } from '../../../../../__fixtures__/services/logger';
import { resetTable } from '../../../../../__utils__/postgre';

import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import { PostgreService } from '../../../../../../src/services/postgre';
import * as jobsLib from '../../../../../../src/lib/jobs/send-transactions';
import { AmqpService } from '../../../../../../src/services/amqp';
import { WebProcess } from '../../../../../../src/processes/generated-api-web/web-process';
import {
  flexibleTokenContract,
  testAccount,
  testAccount2,
} from '../../../../../__fixtures__/smart-contract';

describe('[processes/generated-api-web/api/controllers] Send job controller', () => {
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
    await resetTable(postgreService.pool, PostgreTables.OPERATIONS);
    await resetTable(postgreService.pool, PostgreTables.JOBS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#sendTransactionsAndCreateJobAsync', () => {
    it('should return 404 when there is no such an entry point in the smart contract', async () => {
      const { body, status } = await request
        .post('/api/send/transferMany')
        .send({
          sourceAddress: testAccount,
        });

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: 'not found',
        status: 404,
      });
    });

    it('should return 400 when there is an extra parameter in request param', async () => {
      const { body, status } = await request.post('/api/send/lock').send({
        parameters: {
          tokens: 1,
          destination: testAccount2,
        },
        secureKeyName: testAccount2,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.body should NOT have additional properties',
        status: 400,
      });
    });

    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request.post('/api/send/transfer').send({
        secureKeyName: 'toto',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'parameters'",
        status: 400,
      });
    });

    it('should return 400 when there is a parameter not match the format', async () => {
      const { body, status } = await request.post('/api/send/transfer').send({
        parameters: {
          tokens: 1,
          destination: testAccount.substring(0, 35),
        },
        secureKeyName: testAccount,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.body.parameters.destination should match pattern "^[0-9a-zA-Z]{36}$"',
        status: 400,
      });
    });

    it('should return 400 when entry point parameters have extra parameter', async () => {
      const { body, status } = await request.post('/api/send/transfer').send({
        parameters: {
          tokens: 1,
          destination: testAccount2,
          from: testAccount2,
        },
        secureKeyName: testAccount,
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.body.parameters should NOT have additional properties',
        status: 400,
      });
    });

    it('should return 404 when vault signer return 404', async () => {
      const vaultNock = nock('http://localhost:8300')
        .get('/v1/transit/keys/toto')
        .reply(404, {
          errors: 'NOT FOUND',
        });

      const { body, status } = await request.post('/api/send/transfer').send({
        secureKeyName: 'toto',
        parameters: {
          tokens: 1,
          destination: testAccount2,
        },
      });

      vaultNock.done();

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: '{"errors":"NOT FOUND"}',
        status: 404,
      });
    });

    describe('the secure key is in vault list', () => {
      let vaultNock: nock.Scope;

      beforeEach(() => {
        vaultNock = nock('http://localhost:8300')
          .get('/v1/transit/keys/toto')
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
                '2': {
                  creation_time: '2021-02-02T10:01:29.097094+01:00',
                  name: 'ed25519',
                  public_key: 'L04JMAN9Lph+aSKZz0W/KzYPOa2tnBZhaZLvSwiNzMY=',
                },
              },
              latest_version: 1,
              min_available_version: 0,
              min_decryption_version: 1,
              min_encryption_version: 0,
              name: 'toto',
              supports_decryption: false,
              supports_derivation: true,
              supports_encryption: false,
              supports_signing: true,
              type: 'ed25519',
            },
            warnings: null,
          });
      });

      it('should return 500 when unexpected error happen', async () => {
        jest
          .spyOn(jobsLib, 'sendTransactionsAsync')
          .mockRejectedValue(new Error('Unexpected error'));

        const { body, status } = await request.post('/api/send/transfer').send({
          secureKeyName: 'toto',
          parameters: {
            tokens: 1,
            destination: testAccount2,
          },
        });

        vaultNock.done();

        expect(status).toEqual(500);
        expect(body).toEqual({
          message: 'Internal Server Error',
          status: 500,
        });
      });

      it('should return 201 and the job with operation hash when', async () => {
        const publishMessageSpy = jest
          .spyOn(amqpService, 'sendToQueue')
          .mockImplementation();

        const { body, status } = await request
          .post('/api/async/send/transfer')
          .send({
            secureKeyName: 'toto',
            parameters: {
              tokens: 1,
              destination: testAccount2,
            },
          });

        vaultNock.done();
        expect({ body, status }).toEqual({
          status: 201,
          body: {
            id: body.id,
            operation_hash: null,
            raw_transaction: null,
            status: 'created',
            error_message: null,
          },
        });
        expect(publishMessageSpy.mock.calls).toEqual([
          [
            {
              transactions: [
                {
                  contractAddress: flexibleTokenContract,
                  entryPoint: 'transfer',
                  entryPointParams: {
                    tokens: 1,
                    destination: testAccount2,
                  },
                },
              ],
              callerId: undefined,
              useCache: true,
              secureKeyName: 'toto',
              jobId: body.id,
            },
            'send-transaction',
          ],
        ]);
      });
    });
  });
});
