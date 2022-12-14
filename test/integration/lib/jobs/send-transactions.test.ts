import nock from 'nock';
import { ContractMethod, ContractProvider } from '@taquito/taquito';

import { resetTable, selectData } from '../../../__utils__/postgre';
import {
  amqpConfig,
  postgreConfig,
  tezosNodeUrl,
  tezosNodeUrls,
} from '../../../__fixtures__/config';
import {
  TestContractMethod,
  TestOperationBatch,
} from '../../../__fixtures__/contract-method';
import { logger } from '../../../__fixtures__/services/logger';
import {
  FA2Contract,
  flexibleTokenContract,
  testAccount,
  testAccount2,
} from '../../../__fixtures__/smart-contract';

import { PostgreService } from '../../../../src/services/postgre';
import { TezosService } from '../../../../src/services/tezos';
import { PostgreTables } from '../../../../src/const/postgre/postgre-tables';
import * as libSmartContracts from '../../../../src/lib/smart-contracts';
import { VaultSigner } from '../../../../src/services/signers/vault';
import {
  sendTransactions,
  sendTransactionsAsync,
} from '../../../../src/lib/jobs/send-transactions';
import { JobStatus } from '../../../../src/const/job-status';
import { Jobs } from '../../../../src/const/interfaces/jobs';
import { insertJob } from '../../../../src/models/jobs';
import { vaultClientConfig } from '../../../../src/config';
import {
  InvalidMapStructureParams,
  MissingParameter,
} from '../../../../src/const/errors/invalid-entry-point-params';
import { AmqpService } from '../../../../src/services/amqp';
import { GatewayPool } from '../../../../src/services/gateway-pool';
import { OpKind } from '@taquito/rpc';

describe('[lib/jobs/send-transactions] Send Transactions', () => {
  const postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeUrl);
  const amqpService = new AmqpService(amqpConfig, logger);
  const gatewayPool = new GatewayPool(tezosNodeUrls, logger);

  beforeAll(async () => {
    await postgreService.initializeDatabase();
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.OPERATIONS);
    await resetTable(postgreService.pool, PostgreTables.JOBS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await postgreService.disconnect();
  });

  describe('#sendTransactionsAsync', () => {
    let sendToQueueSpy: jest.SpyInstance;

    beforeEach(() => {
      sendToQueueSpy = jest
        .spyOn(amqpService, 'sendToQueue')
        .mockImplementation();
    });

    it('should correctly insert the job and publish message to the queue', async () => {
      await sendTransactionsAsync(
        {
          transactions: [
            { contractAddress: 'contractAddress', entryPoint: 'entrypoint' },
          ],
          secureKeyName: 'toto',
          useCache: true,
        },
        postgreService,
        amqpService,
        logger,
      );
      const insertJobs = await selectData(postgreService.pool, {
        tableName: PostgreTables.JOBS,
        selectFields: '*',
      });

      expect(sendToQueueSpy.mock.calls).toEqual([
        [
          {
            transactions: [
              { contractAddress: 'contractAddress', entryPoint: 'entrypoint' },
            ],
            secureKeyName: 'toto',
            jobId: insertJobs[0].id,
            callerId: undefined,
            useCache: true,
          },
          'send-transaction',
        ],
      ]);

      expect(insertJobs).toEqual([
        {
          id: insertJobs[0].id,
          forged_operation: null,
          operation_kind: OpKind.TRANSACTION,
          operation_hash: null,
          status: 'created',
          error_message: null,
        },
      ]);
    });

    it('should throw error and log an error when any unexpected error happened ', async () => {
      const loggerErrorSpy = jest.spyOn(logger, 'error');
      sendToQueueSpy.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await expect(
        sendTransactionsAsync(
          {
            transactions: [
              { contractAddress: 'contractAddress', entryPoint: 'entrypoint' },
            ],
            secureKeyName: 'toto',
            useCache: true,
          },
          postgreService,
          amqpService,
          logger,
        ),
      ).rejects.toThrow(Error('Unexpected error'));

      const insertJobs = await selectData(postgreService.pool, {
        tableName: PostgreTables.JOBS,
        selectFields: '*',
      });

      expect(loggerErrorSpy.mock.calls).toEqual([
        [
          { error: 'Unexpected error' },
          '[lib/jobs/sendTransactionsAsync] Unexpected error happened',
        ],
      ]);

      expect(sendToQueueSpy.mock.calls).toEqual([
        [
          {
            transactions: [
              { contractAddress: 'contractAddress', entryPoint: 'entrypoint' },
            ],
            secureKeyName: 'toto',
            jobId: insertJobs[0].id,
            callerId: undefined,
            useCache: true,
          },
          'send-transaction',
        ],
      ]);

      expect(insertJobs).toEqual([
        {
          id: insertJobs[0].id,
          forged_operation: null,
          operation_kind: OpKind.TRANSACTION,
          operation_hash: null,
          status: 'created',
          error_message: null,
        },
      ]);
    });
  });

  describe('#sendTransactions', () => {
    const vaultSigner = new VaultSigner(vaultClientConfig, 'toto', logger);

    const testContractMethod = new TestContractMethod();
    let getContractMethodSpy: jest.SpyInstance;
    let setSignerSpy: jest.SpyInstance;
    let getContractSpy: jest.SpyInstance;

    let insertedJob: Jobs;

    beforeEach(async () => {
      getContractMethodSpy = jest
        .spyOn(libSmartContracts, 'getContractMethod')
        .mockReturnValue(
          testContractMethod as unknown as ContractMethod<ContractProvider>,
        );
      setSignerSpy = jest.spyOn(tezosService, 'setSigner');

      getContractSpy = jest
        .spyOn(tezosService, 'getContractFromCache')
        .mockImplementation();

      jest
        .spyOn(gatewayPool, 'getTezosService')
        .mockResolvedValue(tezosService);

      const {
        rows: [result],
      } = await insertJob(postgreService.pool, {
        status: JobStatus.CREATED,
        forged_operation: 'raw_transaction',
        operation_kind: OpKind.TRANSACTION,
      });

      insertedJob = result;
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should call directly the contract method send when there is only 1 transaction', async () => {
      const vaultNock = nock(vaultClientConfig.apiUrl)
        .get(`/transit/keys/toto`)
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

      await sendTransactions(
        {
          transactions: [
            { contractAddress: 'contractAddress', entryPoint: 'entrypoint' },
          ],
          secureKeyName: 'toto',
          useCache: true,
          jobId: insertedJob.id,
        },
        gatewayPool,
        postgreService,
        logger,
      );

      vaultNock.done();

      expect(getContractSpy.mock.calls).toEqual([['contractAddress']]);
      expect(getContractMethodSpy.mock.calls).toEqual([
        [logger, undefined, 'entrypoint', undefined],
      ]);
      expect(setSignerSpy.mock.calls).toEqual([[vaultSigner]]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          forged_operation: 'raw_transaction',
          operation_kind: OpKind.TRANSACTION,
          operation_hash: 'hashValue',
          status: 'published',
          error_message: null,
        },
      ]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.OPERATIONS,
          selectFields:
            'job_id, destination, source, parameters, parameters_json, amount, fee, storage_limit, gas_limit, counter, branch',
          conditionFields: `job_id=${insertedJob.id}`,
        }),
      ).resolves.toEqual([
        {
          destination: 'contractAddress',
          source: 'tz1bPE9QnvCbK2b2RkR5nQNr7RB9oQGS7ydz',
          parameters: null,
          parameters_json:
            '{"entrypoint":"entrypoint","value":{"entrypoint":0}}',
          amount: 0,
          fee: null,
          storage_limit: null,
          gas_limit: null,
          branch: null,
          counter: null,
          job_id: insertedJob.id,
        },
      ]);
    });

    it('should call batch transaction and send transaction by batch when there are more than 1 transaction', async () => {
      const vaultNock = nock(vaultClientConfig.apiUrl)
        .get(`/transit/keys/toto`)
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

      const batch = new TestOperationBatch();

      const createBatchSpy = jest
        .spyOn(tezosService, 'createBatch')
        .mockResolvedValue(batch as unknown as never);
      const withTransferSpy = jest.spyOn(batch, 'withTransfer');
      await sendTransactions(
        {
          transactions: [
            { contractAddress: 'contractAddress', entryPoint: 'entrypoint' },
            {
              contractAddress: 'contractAddress2',
              entryPoint: 'entrypoint',
              entryPointParams: 'entryPointParams',
            },
          ],
          useCache: true,
          jobId: insertedJob.id,
          secureKeyName: 'toto',
        },
        gatewayPool,
        postgreService,
        logger,
      );

      vaultNock.done();

      expect(getContractSpy.mock.calls).toEqual([
        ['contractAddress'],
        ['contractAddress2'],
      ]);
      expect(getContractMethodSpy.mock.calls).toEqual([
        [logger, undefined, 'entrypoint', undefined],
        [logger, undefined, 'entrypoint', 'entryPointParams'],
      ]);
      expect(createBatchSpy).toHaveBeenCalledTimes(1);
      expect(withTransferSpy.mock.calls).toEqual([
        ['toTransferParams'],
        ['toTransferParams'],
      ]);
      expect(setSignerSpy.mock.calls).toEqual([[vaultSigner]]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          forged_operation: 'raw_transaction',
          operation_kind: OpKind.TRANSACTION,
          operation_hash: 'hashValue',
          status: 'published',
          error_message: null,
        },
      ]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.OPERATIONS,
          selectFields:
            'job_id, destination, source, parameters, parameters_json, amount, fee, storage_limit, gas_limit, counter, branch',
          conditionFields: `job_id=${insertedJob.id}`,
        }),
      ).resolves.toEqual([
        {
          destination: 'contractAddress',
          source: 'tz1bPE9QnvCbK2b2RkR5nQNr7RB9oQGS7ydz',
          parameters: null,
          parameters_json:
            '{"entrypoint":"entrypoint","value":{"entrypoint":0}}',
          amount: 0,
          fee: null,
          storage_limit: null,
          gas_limit: null,
          branch: null,
          counter: null,
          job_id: insertedJob.id,
        },
        {
          destination: 'contractAddress2',
          source: 'tz1bPE9QnvCbK2b2RkR5nQNr7RB9oQGS7ydz',
          parameters: null,
          parameters_json:
            '{"entrypoint":"entrypoint","value":{"entrypoint":"entryPointParams"}}',
          amount: 0,
          fee: null,
          storage_limit: null,
          gas_limit: null,
          branch: null,
          counter: null,
          job_id: insertedJob.id,
        },
      ]);
    });

    it('should throw MissingParameter but not log error  when contract entry point parameters does not match', async () => {
      jest.restoreAllMocks();
      const loggerErrorSpy = jest.spyOn(logger, 'error');

      const vaultNock = nock(vaultClientConfig.apiUrl)
        .get(`/transit/keys/toto`)
        .times(2)
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

      await expect(
        sendTransactions(
          {
            transactions: [
              {
                contractAddress: flexibleTokenContract,
                entryPoint: 'transfer',
                entryPointParams: {
                  fake_tokens: 1,
                  destination: testAccount2,
                },
              },
            ],
            useCache: true,
            jobId: insertedJob.id,
            secureKeyName: 'toto',
          },
          gatewayPool,
          postgreService,
          logger,
        ),
      ).rejects.toThrow(MissingParameter);
      vaultNock.done();

      expect(loggerErrorSpy).toHaveBeenCalledTimes(0);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          forged_operation: 'raw_transaction',
          operation_kind: OpKind.TRANSACTION,
          operation_hash: null,
          status: 'error',
          error_message:
            'Missing parameter name, No child object has the name "tokens"',
        },
      ]);
    }, 20000);

    it('should throw InvalidMapStructureParams but not log error  when contract entry point parameters does not match', async () => {
      jest.restoreAllMocks();
      const loggerErrorSpy = jest.spyOn(logger, 'error');

      const vaultNock = nock(vaultClientConfig.apiUrl)
        .get(`/transit/keys/toto`)
        .times(2)
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

      await expect(
        sendTransactions(
          {
            transactions: [
              {
                contractAddress: FA2Contract,
                entryPoint: 'mint',
                entryPointParams: {
                  amount: 100,
                  address: testAccount,
                  token_id: 1,
                  metadata: [
                    {
                      key: 'name',
                    },
                  ],
                },
              },
            ],
            useCache: true,
            jobId: insertedJob.id,
            secureKeyName: 'toto',
          },
          gatewayPool,
          postgreService,
          logger,
        ),
      ).rejects.toThrow(InvalidMapStructureParams);
      vaultNock.done();

      expect(loggerErrorSpy).toHaveBeenCalledTimes(0);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          forged_operation: 'raw_transaction',
          operation_kind: OpKind.TRANSACTION,
          operation_hash: null,
          status: 'error',
          error_message:
            'Invalid map structure, map have to respect the type: {"key": <key>, "value": <value>}[]',
        },
      ]);
    }, 20000);

    it('should throw error and log an error when any unexpected error happened ', async () => {
      const loggerErrorSpy = jest.spyOn(logger, 'error');
      setSignerSpy.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await expect(
        sendTransactions(
          {
            transactions: [
              {
                contractAddress: flexibleTokenContract,
                entryPoint: 'transfer',
                entryPointParams: {
                  fake_tokens: 1,
                  destination: testAccount2,
                },
              },
            ],
            useCache: true,
            jobId: insertedJob.id,
            secureKeyName: 'toto',
          },
          gatewayPool,
          postgreService,
          logger,
        ),
      ).rejects.toThrow(Error('Unexpected error'));

      expect(loggerErrorSpy.mock.calls).toEqual([
        [
          { error: 'Unexpected error' },
          '[lib/jobs/send-transactions/#sendTransactions] Unexpected error happened',
        ],
      ]);
      expect(setSignerSpy.mock.calls).toEqual([[vaultSigner]]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          forged_operation: 'raw_transaction',
          operation_kind: OpKind.TRANSACTION,
          operation_hash: null,
          status: 'error',
          error_message: 'Unexpected error',
        },
      ]);
    });
  });
});
