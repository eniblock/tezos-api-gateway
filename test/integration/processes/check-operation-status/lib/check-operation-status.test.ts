import {
  amqpConfig,
  postgreConfig,
  tezosNodeUrl,
  tezosNodeUrls,
} from '../../../../__fixtures__/config';
import { logger } from '../../../../__fixtures__/services/logger';
import { resetTable, selectData } from '../../../../__utils__/postgre';

import { PostgreService } from '../../../../../src/services/postgre';
import { TezosService } from '../../../../../src/services/tezos';
import { PostgreTables } from '../../../../../src/const/postgre/postgre-tables';
import { JobStatus } from '../../../../../src/const/job-status';
import { operationHash } from '../../../../__fixtures__/operation';
import { checkOperationStatus } from '../../../../../src/processes/workers/check-operation-status/lib/check-operation-status';
import { IndexerPool } from '../../../../../src/services/indexer-pool';
import { nbOfConfirmation, nbOfRetry } from '../../../../../src/config';
import { AmqpService } from '../../../../../src/services/amqp';
import { insertTransaction } from '../../../../../src/models/operations';
import { selectJobs } from '../../../../../src/models/jobs';
import { Jobs } from '../../../../../src/const/interfaces/jobs';
import { OpKind } from '@taquito/rpc';
import { GatewayPool } from '../../../../../src/services/gateway-pool';
import { OperationNotFoundError } from '../../../../../src/const/errors/indexer-error';
import { Settings } from 'luxon';

describe('[check-operation-status/lib/check-operation-status]', () => {
  const postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeUrl);
  const amqpService = new AmqpService(amqpConfig, logger);
  const indexerPool = new IndexerPool(logger);
  const gatewayPool = new GatewayPool(tezosNodeUrls, logger);
  const oldNow = Settings.now;

  beforeAll(async () => {
    await postgreService.initializeDatabase();
    await indexerPool.initializeIndexers();
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.OPERATIONS);
    await resetTable(postgreService.pool, PostgreTables.JOBS);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await postgreService.disconnect();
  });

  describe('#checkOperationStatus', () => {
    const loggerErrorSpy = jest.spyOn(logger, 'error');
    beforeEach(async () => {
      await postgreService.pool.query(
        `INSERT INTO ${PostgreTables.JOBS} (status,forged_operation,operation_hash,operation_kind)
        VALUES('${JobStatus.CREATED}', 'raw_transaction', NULL, '${OpKind.TRANSACTION}'),
        ('${JobStatus.PUBLISHED}', 'raw_transaction_2', '${operationHash}', '${OpKind.TRANSACTION}'),
        ('${JobStatus.CREATED}', 'raw_transaction_3', '${operationHash}', '${OpKind.TRANSACTION}')`,
      );
    });

    it('should correctly update the job with the correct operation hash and status', async () => {
      await checkOperationStatus(
        { postgreService, tezosService, amqpService, indexerPool, gatewayPool },
        logger,
      );

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: 'status, operation_hash, forged_operation',
          orderBy: 'forged_operation ASC',
        }),
      ).resolves.toEqual([
        {
          status: 'created',
          forged_operation: 'raw_transaction',
          operation_hash: null,
        },
        {
          status: 'done',
          forged_operation: 'raw_transaction_2',
          operation_hash: operationHash,
        },
        {
          status: 'created',
          forged_operation: 'raw_transaction_3',
          operation_hash: operationHash,
        },
      ]);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
    }, 10000);

    it('should correctly publish the message with the parameters', async () => {
      const publishSpy = jest
        .spyOn(amqpService, 'publishMessage')
        .mockImplementation();

      const [publishedJob] = (await selectJobs(
        postgreService.pool,
        'id',
        `status='${JobStatus.PUBLISHED}'`,
      )) as Jobs[];

      await insertTransaction(postgreService.pool, {
        destination: 'destination',
        source: 'source',
        parameters_json: {
          entrypoint: 'entrypoint',
          value: { entrypoint: { name: 'toto' } },
        },
        amount: 0,
        callerId: 'myCaller',
        jobId: publishedJob.id,
      });
      await insertTransaction(postgreService.pool, {
        destination: 'destination2',
        source: 'source2',
        parameters_json: {
          entrypoint: 'entrypoint2',
          value: { entrypoint2: { name: 'tata' } },
        },
        amount: 0,
        callerId: 'myCaller2',
        jobId: publishedJob.id,
      });

      await checkOperationStatus(
        { postgreService, tezosService, amqpService, indexerPool, gatewayPool },
        logger,
      );

      expect(publishSpy).toHaveBeenCalledTimes(2);
      expect(publishSpy).toHaveBeenCalledWith(
        'headers-exchange',
        '',
        {
          contractAddress: 'destination',
          entrypoint: 'entrypoint',
          jobId: publishedJob.id,
          parameters: {
            entrypoint: 'entrypoint',
            value: { entrypoint: { name: 'toto' } },
          },
        },
        {
          headers: {
            entrypoint: 'entrypoint',
            contractAddress: 'destination',
            callerId: 'myCaller',
          },
        },
      );
      expect(publishSpy).toHaveBeenCalledWith(
        'headers-exchange',
        '',
        {
          contractAddress: 'destination2',
          entrypoint: 'entrypoint2',
          jobId: publishedJob.id,
          parameters: {
            entrypoint: 'entrypoint2',
            value: { entrypoint2: { name: 'tata' } },
          },
        },
        {
          headers: {
            entrypoint: 'entrypoint2',
            contractAddress: 'destination2',
            callerId: 'myCaller2',
          },
        },
      );

      expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
    }, 10000);

    it('should log error if unexpected error happened', async () => {
      const checkIfOperationIsConfirmedByRandomIndexerSpy = jest
        .spyOn(indexerPool, 'checkIfOperationIsConfirmedByRandomIndexer')
        .mockRejectedValue(new Error('Unexpected error'));

      await checkOperationStatus(
        { postgreService, tezosService, amqpService, indexerPool, gatewayPool },
        logger,
      );

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: 'status, operation_hash, forged_operation',
        }),
      ).resolves.toEqual([
        {
          status: 'created',
          forged_operation: 'raw_transaction',
          operation_hash: null,
        },
        {
          status: 'published',
          forged_operation: 'raw_transaction_2',
          operation_hash: operationHash,
        },
        {
          status: 'created',
          forged_operation: 'raw_transaction_3',
          operation_hash: operationHash,
        },
      ]);

      expect(
        checkIfOperationIsConfirmedByRandomIndexerSpy,
      ).toHaveBeenCalledWith(
        tezosService,
        {
          operationHash,
          nbOfConfirmation,
        },
        nbOfRetry,
      );
      expect(
        checkIfOperationIsConfirmedByRandomIndexerSpy,
      ).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy.mock.calls).toEqual([
        [
          { err: Error('Unexpected error') },
          '[lib/checkOperationStatus] Unexpected error happen',
        ],
      ]);
    });

    it('should remove operation from mempool and set job to ERROR when the operation is expired', async () => {
      const [publishedJob] = (await selectJobs(
        postgreService.pool,
        'id',
        `status='${JobStatus.PUBLISHED}'`,
      )) as Jobs[];
      Settings.now = () => new Date(2022, 3, 28).valueOf();

      await insertTransaction(postgreService.pool, {
        destination: 'destination',
        source: 'source',
        parameters_json: {
          entrypoint: 'entrypoint',
          value: { entrypoint: { name: 'toto' } },
        },
        amount: 0,
        callerId: 'myCaller',
        jobId: publishedJob.id,
      });
      await insertTransaction(postgreService.pool, {
        destination: 'destination2',
        source: 'source2',
        parameters_json: {
          entrypoint: 'entrypoint2',
          value: { entrypoint2: { name: 'tata' } },
        },
        amount: 0,
        callerId: 'myCaller2',
        jobId: publishedJob.id,
      });
      Settings.now = oldNow;

      const checkIfOperationIsConfirmedByRandomIndexerSpy = jest
        .spyOn(indexerPool, 'checkIfOperationIsConfirmedByRandomIndexer')
        .mockRejectedValue(new OperationNotFoundError(operationHash));

      const removeOperationFromMempoolSpy = jest.spyOn(
        gatewayPool,
        'removeOperationFromMempool',
      );

      await checkOperationStatus(
        { postgreService, tezosService, amqpService, indexerPool, gatewayPool },
        logger,
      );

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: 'status, operation_hash, forged_operation',
        }),
      ).resolves.toEqual([
        {
          status: 'created',
          forged_operation: 'raw_transaction',
          operation_hash: null,
        },
        {
          status: 'created',
          forged_operation: 'raw_transaction_3',
          operation_hash: operationHash,
        },
        {
          status: 'error',
          forged_operation: 'raw_transaction_2',
          operation_hash: operationHash,
        },
      ]);

      expect(
        checkIfOperationIsConfirmedByRandomIndexerSpy,
      ).toHaveBeenCalledWith(
        tezosService,
        {
          operationHash,
          nbOfConfirmation,
        },
        nbOfRetry,
      );

      expect(
        checkIfOperationIsConfirmedByRandomIndexerSpy,
      ).toHaveBeenCalledTimes(1);

      expect(removeOperationFromMempoolSpy).toHaveBeenCalledTimes(1);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(0);
    });
  });
});
