import { Pool } from 'pg';
import format from 'pg-format';

import { PostgreTables } from '../../../src/const/postgre/postgre-tables';
import { PostgreTypes } from '../../../src/const/postgre/postgre-types';

const EXISTING_TABLES = Object.values(PostgreTables);
const EXISTING_TYPES = Object.values(PostgreTypes);

export async function resetDatabase(pool: Pool) {
  for (const tableName of EXISTING_TABLES) {
    await dropTable(pool, tableName);
  }
  for (const typeName of EXISTING_TYPES) {
    await dropType(pool, typeName);
  }
}

export function resetTable(pool: Pool, tableName: string) {
  return pool.query(`DELETE FROM ${tableName}`);
}

export function createJobStatusEnum(pool: Pool) {
  return pool.query(
    `CREATE TYPE job_status AS ENUM ('forged', 'signed', 'submitted', 'failed', 'confirmed')`,
  );
}

export async function checkIfTableExist(pool: Pool, tableName: string) {
  const { rows: result } = await pool.query(
    `SELECT to_regclass('public.${tableName}')`,
  );

  if (result.length === 0) {
    return false;
  }

  return !!result[0].to_regclass;
}

export async function checkIfTypeExist(pool: Pool, typeName: string) {
  const result = await pool.query(
    `SELECT typname FROM pg_type WHERE typname = '${typeName}'`,
  );

  return result.rows.length > 0;
}

export function dropTable(pool: Pool, tableName: string) {
  return pool.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
}

export function dropType(pool: Pool, typeName: string) {
  return pool.query(`DROP TYPE IF EXISTS ${typeName}`);
}

export async function selectData(
  pool: Pool,
  {
    tableName,
    selectFields,
    conditionFields,
    orderBy,
  }: {
    tableName: string;
    selectFields: string;
    conditionFields?: string;
    orderBy?: string;
  },
) {
  const condition = conditionFields ? `WHERE ${conditionFields}` : '';
  const order = orderBy ? `ORDER BY ${orderBy}` : '';

  return (
    await pool.query(
      format(
        `SELECT %s FROM %s %s %s`,
        selectFields,
        tableName,
        condition,
        order,
      ),
    )
  ).rows;
}
