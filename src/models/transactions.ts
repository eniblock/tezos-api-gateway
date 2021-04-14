import { Pool } from 'pg';

import { PostgreTables } from '../const/postgre/postgre-tables';
import { TransactionParametersJson } from '../const/interfaces/transaction-parameters-json';
import { OperationContentsTransactionWithParametersJson } from '../const/interfaces/send-transactions-params';

const TABLE_NAME = PostgreTables.TRANSACTION;

/**
 * Insert all the parameters that are used to forge a batch of operations (parameters related to a batch transaction)
 *
 * @param {object} pool                - the postgre pool used to insert
 * @param {object[]} operationContents - all the parameters related to a batch transaction with corresponding parameters as json type
 * @param {string} branch              - the branch's address which did the forge
 * @param {string} jobId               - the corresponding job id
 *
 */
export function insertTransactions(
  pool: Pool,
  operationContents: OperationContentsTransactionWithParametersJson[],
  branch: string,
  jobId: number,
) {
  const valuesString = operationContents.map(
    ({
      destination,
      parameters,
      parametersJson,
      amount,
      fee,
      source,
      storage_limit,
      gas_limit,
      counter,
    }) =>
      `('${destination}', '${JSON.stringify(parameters)}', '${JSON.stringify(
        parametersJson,
      )}', ${parseInt(amount, 10)},  ${parseInt(
        fee,
        10,
      )},  '${source}', ${parseInt(storage_limit, 10)},  ${parseInt(
        gas_limit,
        10,
      )}, ${parseInt(counter, 10)}, '${branch}', ${jobId})`,
  );

  return pool.query(
    `INSERT INTO ${TABLE_NAME} (destination, parameters, parameters_json, amount, fee, source, storage_limit, gas_limit, counter, branch, job_id) 
    VALUES ${valuesString.join(',')} RETURNING *`,
  );
}

/**
 * Insert the transaction with only destination, source, parameters_json and jobId
 *
 * @param {object} pool               - the postgre pool used to insert
 * @param {string} destination        - the smart contract address
 * @param {string} source             - the address of the account which performed the transaction
 * @param {object} parameters_json    - the parameters of the transaction in json format
 * @param {string} jobId              - the corresponding job id
 *
 * @return {Promise<object>} the new transaction inserted
 */
export async function insertTransactionWithParametersJson(
  pool: Pool,
  {
    destination,
    source,
    parameters_json,
    jobId,
  }: {
    jobId: number;
    parameters_json: TransactionParametersJson;
    destination: string;
    source: string;
  },
) {
  return pool.query(
    `INSERT INTO ${TABLE_NAME} (destination, source, parameters_json, job_id)
        VALUES('${destination}', '${source}','${JSON.stringify(
      parameters_json,
    )}', ${jobId}) RETURNING *`,
  );
}

/**
 * Select the specific data from transaction table
 *
 * @param {object} pool                - the postgre pool used to insert
 * @param {string} selectFields        - the data fields selected
 * @param {string} conditionFields     - the condition to find the data
 *
 * @return Promise<ForgeParameters[]>  the select result
 */
export async function selectTransaction(
  pool: Pool,
  selectFields: string,
  conditionFields?: string,
) {
  const condition = conditionFields ? `WHERE ${conditionFields}` : '';

  return (
    await pool.query(`SELECT ${selectFields} FROM ${TABLE_NAME} ${condition}`)
  ).rows;
}
