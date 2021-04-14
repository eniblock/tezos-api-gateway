import { postgreConfig } from '../../__fixtures__/config';
import { resetTable, selectData } from '../../__utils__/postgre';

import { PostgreService } from '../../../src/services/postgre';
import {
  insertJob,
  selectJobs,
  selectPublishedJobsWithOperationHash,
  updateJobStatus,
  updateJobStatusAndErrorMessage,
  updateJobStatusAndOperationHash,
  updateOperationHash,
} from '../../../src/models/jobs';
import { PostgreTables } from '../../../src/const/postgre/postgre-tables';
import { Jobs } from '../../../src/const/interfaces/jobs';
import { JobStatus } from '../../../src/const/job-status';

describe('[models/jobs]', () => {
  const postgreService = new PostgreService(postgreConfig);

  beforeAll(async () => {
    await postgreService.initializeDatabase();
  });

  afterAll(async () => {
    await postgreService.disconnect();
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.TRANSACTION);
    await resetTable(postgreService.pool, PostgreTables.JOBS);
  });

  describe('#insertJob', () => {
    it('should correctly insert the data when create a job', async () => {
      const { rows: insertedResult } = await insertJob(postgreService.pool, {
        status: JobStatus.CREATED,
        rawTransaction: 'raw_transaction',
      });

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          id: insertedResult[0].id,
          raw_transaction: 'raw_transaction',
          operation_hash: null,
          status: 'created',
          error_message: null,
        },
      ]);
    });
  });

  describe('#selectJobs', () => {
    let job: Jobs;
    let anotherJob: Jobs;
    beforeEach(async () => {
      [job] = (
        await insertJob(postgreService.pool, {
          status: JobStatus.CREATED,
          rawTransaction: 'raw_transaction',
        })
      ).rows;

      [anotherJob] = (
        await insertJob(postgreService.pool, {
          status: JobStatus.CREATED,
          rawTransaction: 'raw_transaction_2',
        })
      ).rows;
    });

    it('should correctly return all data in the database', async () => {
      const result = await selectJobs(postgreService.pool, '*');
      expect(result).toEqual([
        {
          id: job.id,
          status: 'created',
          raw_transaction: 'raw_transaction',
          operation_hash: null,
          error_message: null,
        },
        {
          id: anotherJob.id,
          status: 'created',
          raw_transaction: 'raw_transaction_2',
          operation_hash: null,
          error_message: null,
        },
      ]);
    });

    it('should correctly work with select fields', async () => {
      const result = await selectJobs(
        postgreService.pool,
        'status, raw_transaction',
      );
      expect(result).toEqual([
        {
          status: 'created',
          raw_transaction: 'raw_transaction',
        },
        {
          status: 'created',
          raw_transaction: 'raw_transaction_2',
        },
      ]);
    });

    it('should correctly work with condition fields', async () => {
      const result = await selectJobs(
        postgreService.pool,
        'status, raw_transaction',
        `id = ${job.id}`,
      );
      expect(result).toEqual([
        {
          status: 'created',
          raw_transaction: 'raw_transaction',
        },
      ]);
    });

    it('should return empty array if no jobs match the condition', async () => {
      const result = await selectJobs(
        postgreService.pool,
        'status, raw_transaction',
        'id = -1',
      );
      expect(result).toEqual([]);
    });
  });

  describe('#updateOperationHash', () => {
    let insertedJob: Jobs;
    beforeEach(async () => {
      const {
        rows: [result],
      } = await insertJob(postgreService.pool, {
        status: JobStatus.CREATED,
        rawTransaction: 'raw_transaction',
      });

      insertedJob = result;
    });

    it('should correctly update the job', async () => {
      await expect(
        updateOperationHash(
          postgreService.pool,
          'operation_hash',
          insertedJob.id,
        ),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          raw_transaction: 'raw_transaction',
          operation_hash: 'operation_hash',
          status: 'published',
          error_message: null,
        },
      ]);
    });

    it('should do nothing if the job id does not exist', async () => {
      await expect(
        updateOperationHash(postgreService.pool, 'operation_hash', 123456),
      ).resolves.toEqual([]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          raw_transaction: 'raw_transaction',
          operation_hash: null,
          status: 'created',
          error_message: null,
        },
      ]);
    });
  });

  describe('#updateJobStatus', () => {
    let insertedJob: Jobs;
    beforeEach(async () => {
      const {
        rows: [result],
      } = await insertJob(postgreService.pool, {
        status: JobStatus.CREATED,
        rawTransaction: 'raw_transaction',
      });

      insertedJob = result;
    });

    it('should correctly update the job', async () => {
      await expect(
        updateJobStatus(
          postgreService.pool,
          JobStatus.PUBLISHED,
          insertedJob.id,
        ),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          raw_transaction: 'raw_transaction',
          operation_hash: null,
          status: 'published',
          error_message: null,
        },
      ]);
    });

    it('should do nothing if the job id does not exist', async () => {
      await expect(
        updateOperationHash(postgreService.pool, 'operation_hash', 123456),
      ).resolves.toEqual([]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          raw_transaction: 'raw_transaction',
          operation_hash: null,
          status: 'created',
          error_message: null,
        },
      ]);
    });
  });

  describe('#updateJobStatusAndOperationHash', () => {
    let insertedJob: Jobs;
    beforeEach(async () => {
      const {
        rows: [result],
      } = await insertJob(postgreService.pool, {
        status: JobStatus.CREATED,
        rawTransaction: 'raw_transaction',
      });

      insertedJob = result;
    });

    it('should correctly update the job', async () => {
      await expect(
        updateJobStatusAndOperationHash(
          postgreService.pool,
          JobStatus.PUBLISHED,
          'operation_hash',
          insertedJob.id,
        ),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          raw_transaction: 'raw_transaction',
          operation_hash: 'operation_hash',
          status: 'published',
          error_message: null,
        },
      ]);
    });

    it('should do nothing if the job id does not exist', async () => {
      await expect(
        updateJobStatusAndOperationHash(
          postgreService.pool,
          JobStatus.DONE,
          'operation_hash',
          123456,
        ),
      ).resolves.toEqual([]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          raw_transaction: 'raw_transaction',
          operation_hash: null,
          status: 'created',
          error_message: null,
        },
      ]);
    });
  });

  describe('#updateJobStatusAndErrorMessage', () => {
    let insertedJob: Jobs;
    beforeEach(async () => {
      const {
        rows: [result],
      } = await insertJob(postgreService.pool, {
        status: JobStatus.CREATED,
        rawTransaction: 'raw_transaction',
      });

      insertedJob = result;
    });

    it('should correctly update the job', async () => {
      await expect(
        updateJobStatusAndErrorMessage(
          postgreService.pool,
          JobStatus.PUBLISHED,
          'error',
          insertedJob.id,
        ),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          raw_transaction: 'raw_transaction',
          operation_hash: null,
          status: 'published',
          error_message: 'error',
        },
      ]);
    });

    it('should do nothing if the job id does not exist', async () => {
      await expect(
        updateJobStatusAndOperationHash(
          postgreService.pool,
          JobStatus.DONE,
          'operation_hash',
          123456,
        ),
      ).resolves.toEqual([]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          id: insertedJob.id,
          raw_transaction: 'raw_transaction',
          operation_hash: null,
          status: 'created',
          error_message: null,
        },
      ]);
    });
  });

  describe('#selectPublishedJobsWithOperationHash', () => {
    let forgedJobWithOperationHash: Jobs;
    beforeEach(async () => {
      [, forgedJobWithOperationHash] = (
        await postgreService.pool.query(
          `INSERT INTO ${PostgreTables.JOBS} (status,raw_transaction,operation_hash)
        VALUES('${JobStatus.PUBLISHED}', 'raw_transaction', NULL),
        ('${JobStatus.PUBLISHED}', 'raw_transaction_2', 'operation_hash'),
        ('${JobStatus.DONE}', 'raw_transaction_3', 'operation_hash') RETURNING *`,
        )
      ).rows;
    });

    it('should correctly return the jobs match the requirements', async () => {
      const result = await selectPublishedJobsWithOperationHash(
        postgreService.pool,
      );
      expect(result).toEqual([
        {
          id: forgedJobWithOperationHash.id,
          status: 'published',
          raw_transaction: 'raw_transaction_2',
          operation_hash: 'operation_hash',
          error_message: null,
        },
      ]);
    });
  });
});
