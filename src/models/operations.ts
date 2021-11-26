import { Pool } from 'pg';

import { PostgreTables } from '../const/postgre/postgre-tables';
import { TransactionParametersJson } from '../const/interfaces/transaction-parameters-json';
import { OperationContentsTransactionWithParametersJson } from '../const/interfaces/send-transactions-params';
import { OpKind } from '@taquito/rpc';
import { OperationContentsReveal } from '@taquito/rpc/dist/types/types';
import { Operation } from '../const/interfaces/transaction';

const TABLE_NAME = PostgreTables.OPERATIONS;

/**
 * Insert all the parameters that are used to forge a batch of operations (parameters related to a batch transaction)
 *
 * @param {object} pool                - the postgre pool used to insert
 * @param {object[]} operationContents - all the parameters related to a batch transaction with corresponding parameters as json type
 * @param {string} branch              - the branch's address which did the forge
 * @param {string} jobId               - the corresponding job id
 *
 */
export function insertOperations(
  pool: Pool,
  operationContents:
    | OperationContentsTransactionWithParametersJson[]
    | OperationContentsReveal[],
  branch: string,
  jobId: number,
  callerId: string,
) {
  const valuesString = operationContents.map(
    (
      op:
        | OperationContentsTransactionWithParametersJson
        | OperationContentsReveal,
    ) => {
      return mapOperationValues(op, branch, jobId, callerId);
    },
  );

  return pool.query(
    `INSERT INTO ${TABLE_NAME} (destination, parameters, parameters_json, amount, fee, source, storage_limit, gas_limit, counter, branch, job_id, caller_id, kind, public_key) 
    VALUES ${valuesString.join(',')} RETURNING *`,
  );
}

function mapOperationValues(
  op: OperationContentsTransactionWithParametersJson | OperationContentsReveal,
  branch: string,
  jobId: number,
  callerId: string,
): string {
  if (isOperationAReveal(op)) {
    return `('', NULL, NULL, NULL, ${parseInt(op.fee, 10)},  '${
      op.source
    }', ${parseInt(op.storage_limit, 10)}, ${parseInt(
      op.gas_limit,
      10,
    )}, ${parseInt(op.counter, 10)}, '${branch}', ${jobId}, '${callerId}', '${
      op.kind
    }', '${op.public_key}')`;
  }

  return `('${op.destination}', '${JSON.stringify(
    op.parameters,
  )}', '${JSON.stringify(op.parametersJson)}', ${parseInt(
    op.amount,
    10,
  )},  ${parseInt(op.fee, 10)},  '${op.source}', ${parseInt(
    op.storage_limit,
    10,
  )},  ${parseInt(op.gas_limit, 10)}, ${parseInt(
    op.counter,
    10,
  )}, '${branch}', ${jobId}, '${callerId}', '${op.kind}', NULL)`;
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
    callerId,
  }: {
    jobId: number;
    parameters_json: TransactionParametersJson;
    destination: string;
    source: string;
    callerId: string;
  },
) {
  return pool.query(
    `INSERT INTO ${TABLE_NAME} (destination, source, parameters_json, job_id, caller_id, kind)
        VALUES('${destination}', '${source}','${JSON.stringify(
      parameters_json,
    )}', ${jobId}, '${callerId}', '${OpKind.TRANSACTION}') RETURNING *`,
  );
}

/**
 * Select the specific data from operations table
 *
 * @param {object} pool                - the postgre pool used to insert
 * @param {string} selectFields        - the data fields selected
 * @param {string} conditionFields     - the condition to find the data
 *
 * @return Promise<ForgeParameters[]>  the select result
 */
export async function selectOperation(
  pool: Pool,
  selectFields: string,
  conditionFields?: string,
): Promise<Operation[]> {
  const condition = conditionFields ? `WHERE ${conditionFields}` : '';

  return (
    await pool.query(`SELECT ${selectFields} FROM ${TABLE_NAME} ${condition}`)
  ).rows;
}

/**
 * Type guard to determine if an operation is a reveal
 *
 * @param {object} operation  - the operation to identify
 *
 * @return {boolean}  wether the operation is a reveal or not
 */
export function isOperationAReveal(
  operation: any,
): operation is OperationContentsReveal {
  return operation.kind === OpKind.REVEAL;
}
