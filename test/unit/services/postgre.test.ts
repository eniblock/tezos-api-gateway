import { Pool } from 'pg';

import {
  checkIfTableExist,
  checkIfTypeExist,
  createJobStatusEnum,
  resetDatabase,
} from '../../__utils__/postgre';
import { PostgreService } from '../../../src/services/postgre';
import { postgreConfig } from '../../__fixtures__/config';

describe('[services/postgre]', () => {
  const pool = new Pool(postgreConfig);

  afterAll(async () => {
    await pool.end();
  });

  describe('#initializeDatabase', () => {
    beforeEach(async () => {
      await resetDatabase(pool);
    });

    it('should create the databases and enum if it does not exist', async () => {
      // Check if none of tables or types exists
      expect(await checkIfTableExist(pool, 'jobs')).toEqual(false);
      expect(await checkIfTableExist(pool, 'transaction')).toEqual(false);
      expect(await checkIfTypeExist(pool, 'job_status')).toEqual(false);

      // Create the postgre service
      const postgreService = new PostgreService(postgreConfig);

      await postgreService.initializeDatabase();

      expect(await checkIfTableExist(pool, 'jobs')).toEqual(true);
      expect(await checkIfTableExist(pool, 'transaction')).toEqual(true);
      expect(await checkIfTypeExist(pool, 'job_status')).toEqual(true);

      await postgreService.disconnect();
    });

    it('should not re-create job status type when it exists', async () => {
      // Create job status type
      await createJobStatusEnum(pool);

      // Create the postgre service
      const postgreService = new PostgreService(postgreConfig);

      await postgreService.initializeDatabase();

      expect(await checkIfTableExist(pool, 'jobs')).toEqual(true);
      expect(await checkIfTableExist(pool, 'transaction')).toEqual(true);

      await postgreService.disconnect();
    });

    it('should not throw any duplication errors', async () => {
      // Create the postgre service
      const postgreService = new PostgreService(postgreConfig);

      await postgreService.initializeDatabase();

      await expect(postgreService.initializeDatabase()).resolves.not.toThrow();

      await postgreService.disconnect();
    });
  });
});
