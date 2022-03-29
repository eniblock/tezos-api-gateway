import supertest from 'supertest';
import nock from 'nock';
import { WebProcess } from '../../../../../../src/processes/web/web-process';
import {
  amqpConfig,
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';
import * as userTransferLib from '../../../../../../src/lib/jobs/send-transfer-transactions';
import {
  testAccount,
  testAccount2,
} from '../../../../../__fixtures__/smart-contract';
import { OpKind } from '@taquito/rpc';
import { AmqpService } from '../../../../../../src/services/amqp';
import { logger } from '../../../../../__fixtures__/services/logger';
import { resetTable } from '../../../../../__utils__/postgre';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import { JobStatus } from '../../../../../../src/const/job-status';
import { Jobs } from '../../../../../../src/const/interfaces/jobs';

describe('[processes/web/api/user] User transfer controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);
  const amqpService = new AmqpService(amqpConfig, logger);

  webProcess.postgreService = postgreService;
  webProcess.amqpService = amqpService;

  let vaultNock: nock.Scope;

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

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.OPERATIONS);
    await resetTable(postgreService.pool, PostgreTables.JOBS);
    vaultNock = nock('http://localhost:8300')
      .get('/v1/transit/keys/userId')
      .twice()
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
          name: 'userId',
          supports_decryption: false,
          supports_derivation: true,
          supports_encryption: false,
          supports_signing: true,
          type: 'ed25519',
        },
        warnings: null,
      });
  });

  describe('the secure key is in vault list', () => {
    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request
        .post('/api/user/userId/transfer')
        .send({});

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'transactions'",
        status: 400,
      });
    });

    it('should return 400 when there is extra parameter', async () => {
      const { body, status } = await request
        .post('/api/user/userId/transfer')
        .send({
          transactions: [],
          callerId: 'callerId',
          extra: 'extra',
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.body should NOT have additional properties',
        status: 400,
      });
    });

    it("should return 404 when the user doesn't exist", async () => {
      const vaultNock2 = nock('http://localhost:8300')
        .get(`/v1/transit/keys/fakeUserId`)
        .reply(404, {
          errors: [],
        });

      const { body, status } = await request
        .post('/api/user/fakeUserId/transfer')
        .send({ transactions: [] });

      vaultNock2.done();

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: "Not found : fakeUserId doesn't exist in Vault",
        status: 404,
      });
    });

    it('should return 500 when unexpected error happen', async () => {
      jest
        .spyOn(userTransferLib, 'sendTransferTransactions')
        .mockRejectedValue(new Error('Unexpected error'));

      const { body, status } = await request
        .post('/api/user/userId/transfer')
        .send({
          transactions: [],
        });

      vaultNock.done();

      expect(status).toEqual(500);
      expect(body).toEqual({
        message: 'Internal Server Error',
        status: 500,
      });
    });

    it('should return 201, and sign the data when the request is valid', async () => {
      const job = {
        id: 0,
        operation_hash: 'operation_hash',
        forged_operation: null,
        operation_kind: OpKind.TRANSACTION,
        status: JobStatus.PUBLISHED,
      };

      const sendTransferTransactionSpy = jest
        .spyOn(userTransferLib, 'sendTransferTransactions')
        .mockResolvedValue(job as unknown as Jobs);

      const { body, status } = await request
        .post('/api/user/userId/transfer')
        .send({
          transactions: [
            {
              amount: 10,
              to: testAccount,
            },
            {
              amount: 5,
              to: testAccount2,
            },
          ],
          callerId: 'callerId',
        });

      vaultNock.done();
      expect({ body, status }).toEqual({
        status: 201,
        body: {
          id: body.id,
          operation_hash: 'operation_hash',
          forged_operation: null,
          operation_kind: OpKind.TRANSACTION,
          status: JobStatus.PUBLISHED,
        },
      });

      expect(sendTransferTransactionSpy).toHaveBeenCalledTimes(1);
    });
  });
});
