import nock from 'nock';

import { resetTable, selectData } from '../../../__utils__/postgre';
import {
  postgreConfig,
  tezosNodeUrl,
  tezosNodeUrls,
} from '../../../__fixtures__/config';
import { TestOperationBatch } from '../../../__fixtures__/contract-method';
import { logger } from '../../../__fixtures__/services/logger';
import {
  testAccount,
  testAccount2,
} from '../../../__fixtures__/smart-contract';

import { PostgreService } from '../../../../src/services/postgre';
import { TezosService } from '../../../../src/services/tezos';
import { PostgreTables } from '../../../../src/const/postgre/postgre-tables';
import { VaultSigner } from '../../../../src/services/signers/vault';
import { sendTransferTransactions } from '../../../../src/lib/jobs/send-transfer-transactions';
import { JobStatus } from '../../../../src/const/job-status';
import { Jobs } from '../../../../src/const/interfaces/jobs';
import { insertJob } from '../../../../src/models/jobs';
import { vaultClientConfig } from '../../../../src/config';
import { GatewayPool } from '../../../../src/services/gateway-pool';
import { OpKind } from '@taquito/rpc';
import { TransactionOperation } from '@taquito/taquito/dist/types/operations/transaction-operation';

describe('[lib/jobs/send-transfer-transactions] Send Transfer Transactions', () => {
  const postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeUrl);
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

  describe('#sendTransferTransactions', () => {
    const vaultSigner = new VaultSigner(vaultClientConfig, 'toto', logger);

    let setSignerSpy: jest.SpyInstance;

    let insertedJob: Jobs;

    beforeEach(async () => {
      setSignerSpy = jest.spyOn(tezosService, 'setSigner');
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

    it('should call directly the Tezos service function, transfer(), when there is only 1 transaction', async () => {
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
      const transferSpy = jest
        .spyOn(tezosService, 'transfer')
        .mockResolvedValue({
          hash: 'hashValue',
        } as unknown as TransactionOperation);

      await sendTransferTransactions(
        {
          transactions: [
            {
              amount: 10,
              to: testAccount,
            },
          ],
          jobId: insertedJob.id,
          vaultSigner,
        },
        gatewayPool,
        postgreService,
        logger,
      );

      vaultNock.done();

      expect(transferSpy).toHaveBeenCalledTimes(1);
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
          destination: testAccount,
          source: 'tz1bPE9QnvCbK2b2RkR5nQNr7RB9oQGS7ydz',
          parameters: null,
          parameters_json: null,
          amount: 10,
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
      await sendTransferTransactions(
        {
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
          jobId: insertedJob.id,
          vaultSigner,
          callerId: 'callerId',
        },
        gatewayPool,
        postgreService,
        logger,
      );

      vaultNock.done();

      expect(createBatchSpy).toHaveBeenCalledTimes(1);
      expect(withTransferSpy.mock.calls).toEqual([
        [
          {
            amount: 10,
            mutez: true,
            to: testAccount,
          },
        ],
        [
          {
            amount: 5,
            mutez: true,
            to: testAccount2,
          },
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
          operation_hash: 'hashValue',
          status: 'published',
          error_message: null,
        },
      ]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.OPERATIONS,
          selectFields:
            'job_id, destination, source, parameters, parameters_json, amount, fee, storage_limit, gas_limit, counter, branch, caller_id',
          conditionFields: `job_id=${insertedJob.id}`,
        }),
      ).resolves.toEqual([
        {
          destination: testAccount,
          source: 'tz1bPE9QnvCbK2b2RkR5nQNr7RB9oQGS7ydz',
          parameters: null,
          parameters_json: null,
          amount: 10,
          fee: null,
          storage_limit: null,
          gas_limit: null,
          branch: null,
          counter: null,
          job_id: insertedJob.id,
          caller_id: 'callerId',
        },
        {
          destination: testAccount2,
          source: 'tz1bPE9QnvCbK2b2RkR5nQNr7RB9oQGS7ydz',
          parameters: null,
          parameters_json: null,
          amount: 5,
          fee: null,
          storage_limit: null,
          gas_limit: null,
          branch: null,
          counter: null,
          job_id: insertedJob.id,
          caller_id: 'callerId',
        },
      ]);
    });

    it('should throw error and log an error when any unexpected error happened ', async () => {
      const loggerErrorSpy = jest.spyOn(logger, 'error');
      setSignerSpy.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await expect(
        sendTransferTransactions(
          {
            transactions: [
              {
                amount: 10,
                to: testAccount2,
              },
            ],
            jobId: insertedJob.id,
            vaultSigner,
          },
          gatewayPool,
          postgreService,
          logger,
        ),
      ).rejects.toThrow(Error('Unexpected error'));

      expect(loggerErrorSpy.mock.calls).toEqual([
        [
          { error: 'Unexpected error' },
          '[lib/jobs/send-transfer-transactions/#sendTransferTransactions] Unexpected error happened',
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
