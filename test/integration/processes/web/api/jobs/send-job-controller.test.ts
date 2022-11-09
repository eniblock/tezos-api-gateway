import supertest from 'supertest';
import nock from 'nock';

import {
  amqpConfig,
  postgreConfig,
  serverConfig,
  tezosNodeUrl,
} from '../../../../../__fixtures__/config';
import { resetTable } from '../../../../../__utils__/postgre';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { PostgreTables } from '../../../../../../src/const/postgre/postgre-tables';
import { PostgreService } from '../../../../../../src/services/postgre';
import * as jobsLib from '../../../../../../src/lib/jobs/send-transactions';
import { AmqpService } from '../../../../../../src/services/amqp';
import { logger } from '../../../../../__fixtures__/services/logger';
import {
  flexibleTokenContract,
  testAccount,
  testAccount2,
} from '../../../../../__fixtures__/smart-contract';
import { OpKind } from '@taquito/rpc';
import {
  ContractMethod,
  ContractProvider,
  TezosOperationError,
  TezosPreapplyFailureError,
} from '@taquito/taquito';
import { TezosService } from '../../../../../../src/services/tezos';
import {
  TestContractMethod,
  TestOperationBatch,
} from '../../../../../__fixtures__/contract-method';
import * as libSmartContracts from '../../../../../../src/lib/smart-contracts';

describe('[processes/web/api/jobs] Send job controller', () => {
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
    it('should return 400 when a required parameter is missing', async () => {
      const { body, status } = await request.post('/api/async/send/jobs').send({
        secureKeyName: 'toto',
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.body should have required property 'transactions'",
        status: 400,
      });
    });

    it('should return 400 when there is extra parameter in the transactions', async () => {
      const { body, status } = await request.post('/api/async/send/jobs').send({
        secureKeyName: 'toto',
        transactions: [
          {
            contractAddress: flexibleTokenContract,
            entryPoint: 'transfer',
            entryPointParams: {
              tokens: 1,
              destination: testAccount2,
            },
            sourceAddress: testAccount,
          },
        ],
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.body.transactions[0] should NOT have additional properties',
        status: 400,
      });
    });

    it('should return 400 when fee is set to zero', async () => {
      const { body, status } = await request.post('/api/async/send/jobs').send({
        secureKeyName: 'toto',
        transactions: [
          {
            contractAddress: flexibleTokenContract,
            entryPoint: 'transfer',
            entryPointParams: {
              tokens: 1,
              destination: testAccount2,
            },
            fee: 0,
          },
        ],
      });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: 'request.body.transactions[0].fee should be >= 1',
        status: 400,
      });
    });

    it('should return 404 when vault signer return 404', async () => {
      const vaultNock = nock('http://localhost:8300')
        .get('/v1/transit/keys/toto')
        .reply(404, {
          errors: 'NOT FOUND',
        });

      const { body, status } = await request.post('/api/async/send/jobs').send({
        secureKeyName: 'toto',
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

      it('should return 201 and the job with operation hash when', async () => {
        const publishMessageSpy = jest
          .spyOn(amqpService, 'sendToQueue')
          .mockImplementation();

        const { body, status } = await request
          .post('/api/async/send/jobs')
          .send({
            secureKeyName: 'toto',
            transactions: [
              {
                contractAddress: flexibleTokenContract,
                entryPoint: 'transfer',
                entryPointParams: {
                  tokens: 1,
                  destination: testAccount2,
                },
              },
              {
                contractAddress: flexibleTokenContract,
                entryPoint: 'transfer',
                entryPointParams: {
                  tokens: 1,
                  destination: testAccount2,
                },
              },
            ],
          });

        vaultNock.done();
        expect({ body, status }).toEqual({
          status: 201,
          body: {
            id: body.id,
            operation_hash: null,
            forged_operation: null,
            operation_kind: OpKind.TRANSACTION,
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
                {
                  contractAddress: flexibleTokenContract,
                  entryPoint: 'transfer',
                  entryPointParams: {
                    tokens: 1,
                    destination: testAccount2,
                  },
                },
              ],
              secureKeyName: 'toto',
              jobId: body.id,
              callerId: undefined,
              useCache: true,
            },
            'send-transaction',
          ],
        ]);
      });
    });
  });

  describe('#sendTransactions', () => {
    const tezosService = new TezosService(tezosNodeUrl);

    it('should return 400 when there is a parameter type validation error', async () => {
      const vaultNock = nock('http://localhost:8300')
        .get('/v1/transit/keys/toto')
        .thrice()
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
      jest
        .spyOn(webProcess.gatewayPool, 'getTezosService')
        .mockResolvedValue(tezosService);

      const { body, status } = await request.post('/api/send/jobs').send({
        secureKeyName: 'toto',
        transactions: [
          {
            contractAddress: flexibleTokenContract,
            entryPoint: 'transfer',
            entryPointParams: {
              tokens: 'string',
              destination: testAccount2,
            },
          },
        ],
      });

      vaultNock.done();

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: '[tokens] Value is not a number: string',
        status: 400,
      });
    });

    describe('the secure key is in vault list', () => {
      let vaultNock: nock.Scope;
      const testContractMethod = new TestContractMethod();

      beforeEach(() => {
        jest
          .spyOn(webProcess.gatewayPool, 'getTezosService')
          .mockResolvedValue(tezosService);
        jest
          .spyOn(libSmartContracts, 'getContractMethod')
          .mockReturnValue(
            testContractMethod as unknown as ContractMethod<ContractProvider>,
          );
        jest.spyOn(tezosService, 'getContractFromCache').mockImplementation();

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

      it('should return 400 when an operation error happen', async () => {
        jest.spyOn(testContractMethod, 'send').mockRejectedValue(
          new TezosOperationError([
            {
              kind: 'temporary',
              id: 'proto.011-PtHangz2.michelson_v1.script_rejected',
            },
          ]),
        );

        const { body, status } = await request.post('/api/send/jobs').send({
          secureKeyName: 'toto',
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
        });

        vaultNock.done();

        expect(status).toEqual(400);
        expect(body).toEqual({
          message:
            '(temporary) proto.011-PtHangz2.michelson_v1.script_rejected',
          status: 400,
        });
      });

      it('[batch transactions] should return 400 when an operation error happen', async () => {
        const batch = new TestOperationBatch();
        jest
          .spyOn(tezosService, 'createBatch')
          .mockResolvedValue(batch as unknown as never);
        jest.spyOn(batch, 'withTransfer').mockImplementation();
        jest.spyOn(batch, 'send').mockRejectedValue(
          new TezosOperationError([
            {
              kind: 'temporary',
              id: 'proto.011-PtHangz2.michelson_v1.script_rejected',
            },
          ]),
        );

        const { body, status } = await request.post('/api/send/jobs').send({
          secureKeyName: 'toto',
          transactions: [
            {
              contractAddress: flexibleTokenContract,
              entryPoint: 'transfer',
              entryPointParams: {
                tokens: 1,
                destination: testAccount2,
              },
            },
            {
              contractAddress: flexibleTokenContract,
              entryPoint: 'transfer',
              entryPointParams: {
                tokens: 1,
                destination: testAccount2,
              },
            },
          ],
        });

        vaultNock.done();

        expect(status).toEqual(400);
        expect(body).toEqual({
          message:
            '(temporary) proto.011-PtHangz2.michelson_v1.script_rejected',
          status: 400,
        });
      });

      it('should return 400 when a preapply error happen', async () => {
        jest
          .spyOn(testContractMethod, 'send')
          .mockRejectedValue(
            new TezosPreapplyFailureError(
              'Preapply returned an unexpected result',
            ),
          );

        const { body, status } = await request.post('/api/send/jobs').send({
          secureKeyName: 'toto',
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
        });

        vaultNock.done();

        expect(status).toEqual(400);
        expect(body).toEqual({
          message: 'Preapply returned an unexpected result',
          status: 400,
        });
      });

      it('should return 500 when unexpected error happen', async () => {
        jest
          .spyOn(jobsLib, 'sendTransactions')
          .mockRejectedValue(new Error('Unexpected error'));

        const { body, status } = await request.post('/api/send/jobs').send({
          secureKeyName: 'toto',
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
        });

        vaultNock.done();

        expect(status).toEqual(500);
        expect(body).toEqual({
          message: 'Internal Server Error',
          status: 500,
        });
      });
    });
  });
});
