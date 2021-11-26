import { Pool } from 'pg';

import { JobStatus } from '../const/job-status';
import { PostgreTables } from '../const/postgre/postgre-tables';
import { Jobs } from '../const/interfaces/jobs';

const TABLE_NAME = PostgreTables.JOBS;

/**
 * Insert a job to the database
 *
 * @param {object} pool            - the postgre pool to insert
 * @param {string} status          - the status of the job
 * @param {string} rawTransaction  - (optional) the raw transaction regarding the job
 * @param {string} operationHash   - (optional) the
 *
 * @return Promise<object> the inserted result
 */
export function insertJob(
  pool: Pool,
  {
    status,
    forged_operation,
    operation_hash,
    operation_kind,
  }: {
    status: JobStatus;
    forged_operation?: string;
    operation_hash?: string;
    operation_kind?: string;
  },
) {
  return pool.query(
    `INSERT INTO ${TABLE_NAME} (status,forged_operation,operation_hash,operation_kind)
        VALUES('${status}', ${
      forged_operation ? "'" + forged_operation + "'" : null
    }, ${operation_hash ? "'" + operation_hash + "'" : null}, ${
      operation_kind ? "'" + operation_kind + "'" : null
    }) RETURNING *`,
  );
}

/**
 * Select the jobs corresponding the condition
 *
 * @param {object} pool                - the postgre pool used to select
 * @param {string} selectFields        - the data fields selected
 * @param {string} conditionFields     - the condition to find the data
 *
 * @return Promise<Jobs[]>  the select result
 */
export async function selectJobs(
  pool: Pool,
  selectFields: string,
  conditionFields?: string,
) {
  const condition = conditionFields ? `WHERE ${conditionFields}` : '';

  return (
    await pool.query(`SELECT ${selectFields} FROM ${TABLE_NAME} ${condition}`)
  ).rows;
}

/**
 * Update the job with the operation hash and update the job status
 *
 * @param {object} pool               - the postgre pool
 * @param {string} operationHash      - the operation hash need to be inserted
 *
 * @return Promise<object> the updated result
 */
export async function updateOperationHash(
  pool: Pool,
  operationHash: string,
  jobId: number,
) {
  return (
    await pool.query(
      `UPDATE ${TABLE_NAME} SET operation_hash = '${operationHash}', status = '${JobStatus.PUBLISHED}' WHERE id = ${jobId} RETURNING *`,
    )
  ).rows;
}

/**
 * Update the job status by job id
 *
 * @param {object} pool               - the postgre pool
 * @param {string} status             - the new job status
 *
 * @return Promise<object> the updated result
 */
export async function updateJobStatus(
  pool: Pool,
  status: JobStatus,
  jobId: number,
) {
  return (
    await pool.query(
      `UPDATE ${TABLE_NAME} SET status = '${status}' WHERE id = ${jobId} RETURNING *`,
    )
  ).rows;
}

/**
 * Update the job status and operation hash by job id
 *
 * @param {object} pool               - the postgre pool
 * @param {string} status             - the new job status
 *
 * @return Promise<object> the updated result
 */
export async function updateJobStatusAndOperationHash(
  pool: Pool,
  status: JobStatus,
  operationHash: string,
  jobId: number,
) {
  return (
    await pool.query(
      `UPDATE ${TABLE_NAME} SET status = '${status}', operation_hash = '${operationHash}' WHERE id = ${jobId} RETURNING *`,
    )
  ).rows;
}

/**
 * Update the job status and error message by job id
 *
 * @param {object} pool               - the postgre pool
 * @param {string} status             - the new job status
 * @param {string} errorMessage       - the error message
 *
 * @return Promise<object> the updated result
 */
export async function updateJobStatusAndErrorMessage(
  pool: Pool,
  status: JobStatus,
  errorMessage: string,
  jobId: number,
) {
  return (
    await pool.query(
      `UPDATE ${TABLE_NAME} SET status = '${status}', error_message = '${errorMessage}' WHERE id = ${jobId} RETURNING *`,
    )
  ).rows;
}

/**
 * Select a list of jobs whose status is submitted and operation hash is not null
 *
 * @param {object} pool               - the postgre pool
 */
export function selectPublishedJobsWithOperationHash(
  pool: Pool,
): Promise<Jobs[]> {
  return selectJobs(
    pool,
    '*',
    `operation_hash IS NOT NULL AND status='${JobStatus.PUBLISHED}'`,
  );
}
