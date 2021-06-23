import { OpKind } from '@taquito/rpc';

import { postgreConfig } from '../../__fixtures__/config';
import { resetTable, selectData } from '../../__utils__/postgre';
import { PostgreService } from '../../../src/services/postgre';
import { insertJob } from '../../../src/models/jobs';
import {
  insertTransactions,
  insertTransactionWithParametersJson,
  selectTransaction,
} from '../../../src/models/transactions';
import { PostgreTables } from '../../../src/const/postgre/postgre-tables';
import { Jobs } from '../../../src/const/interfaces/jobs';
import { JobStatus } from '../../../src/const/job-status';

describe('[models/transaction]', () => {
  const postgreService = new PostgreService(postgreConfig);
  let insertedJob: Jobs;

  beforeAll(async () => {
    await postgreService.initializeDatabase();

    const { rows: result } = await insertJob(postgreService.pool, {
      status: JobStatus.CREATED,
      rawTransaction: 'raw_transaction',
    });

    insertedJob = result[0];
  });

  afterAll(async () => {
    await postgreService.disconnect();
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.TRANSACTION);
  });

  describe('#insertTransaction', () => {
    it('should correctly insert the data', async () => {
      const { rows: insertedResult } = await insertTransactions(
        postgreService.pool,
        [
          {
            kind: OpKind.TRANSACTION,
            destination: 'destination',
            amount: '10',
            fee: '10',
            storage_limit: '1000',
            gas_limit: '10000',
            counter: '1234567',
            source: 'source',
            parameters: {
              entrypoint: 'transfer',
              value: {
                prim: 'Pair',
                args: [
                  { string: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw' },
                  { int: '5' },
                ],
              },
            },
            parametersJson: {
              entrypoint: 'transfer',
              value: {
                transfer: {
                  destination: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                  tokens: '5',
                },
              },
            },
          },
          {
            kind: OpKind.TRANSACTION,
            destination: 'destination_2',
            amount: '20',
            fee: '20',
            storage_limit: '1000',
            gas_limit: '10000',
            counter: '1234567',
            source: 'source',
            parameters: {
              entrypoint: 'transfer',
              value: {
                prim: 'Pair',
                args: [
                  { string: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw' },
                  { int: '10' },
                ],
              },
            },
            parametersJson: {
              entrypoint: 'transfer',
              value: {
                transfer: {
                  destination: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                  tokens: '10',
                },
              },
            },
          },
        ],
        'branch_address',
        insertedJob.id,
        'myCaller',
      );

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.TRANSACTION,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          id: insertedResult[0].id,
          destination: 'destination',
          amount: 10,
          fee: 10,
          storage_limit: 1000,
          gas_limit: 10000,
          counter: 1234567,
          source: 'source',
          parameters:
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw"},{"int":"5"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"destination":"tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw","tokens":"5"}}}',
          job_id: insertedJob.id,
          branch: 'branch_address',
          caller_id: 'myCaller',
        },
        {
          id: insertedResult[1].id,
          destination: 'destination_2',
          amount: 20,
          fee: 20,
          storage_limit: 1000,
          gas_limit: 10000,
          counter: 1234567,
          source: 'source',
          parameters:
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw"},{"int":"10"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"destination":"tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw","tokens":"10"}}}',
          job_id: insertedJob.id,
          branch: 'branch_address',
          caller_id: 'myCaller',
        },
      ]);
    });

    it('should throw error when job id does not exist', async () => {
      const fakeId = insertedJob.id + 1;
      await expect(
        insertTransactions(
          postgreService.pool,
          [
            {
              kind: OpKind.TRANSACTION,
              destination: 'destination',
              amount: '10',
              fee: '10',
              storage_limit: '1000',
              gas_limit: '10000',
              counter: '1234567',
              source: 'source',
              parameters: {
                entrypoint: 'transfer',
                value: {
                  prim: 'Pair',
                  args: [
                    { string: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw' },
                    { int: '5' },
                  ],
                },
              },
              parametersJson: {
                entrypoint: 'transfer',
                value: {
                  transfer: {
                    destination: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                    tokens: '5',
                  },
                },
              },
            },
          ],
          'branch_address',
          fakeId,
          'myCaller',
        ),
      ).rejects.toThrowError(
        Error(
          'insert or update on table "transaction" violates foreign key constraint "fk_job"',
        ),
      );
    });
  });

  describe('#insertTransactionWithParametersJson', () => {
    it('should correctly insert the data', async () => {
      const { rows: insertedResult } =
        await insertTransactionWithParametersJson(postgreService.pool, {
          destination: 'destination',
          source: 'source',
          parameters_json: {
            entrypoint: 'transfer',
            value: {
              transfer: {
                destination: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                tokens: '5',
              },
            },
          },
          jobId: insertedJob.id,
          callerId: 'myCaller',
        });

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.TRANSACTION,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          id: insertedResult[0].id,
          destination: 'destination',
          amount: null,
          fee: null,
          storage_limit: null,
          gas_limit: null,
          counter: null,
          source: 'source',
          parameters: null,
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"destination":"tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw","tokens":"5"}}}',
          job_id: insertedJob.id,
          branch: null,
          caller_id: 'myCaller',
        },
      ]);
    });

    it('should throw error when job id does not exist', async () => {
      const fakeId = insertedJob.id + 1;
      await expect(
        insertTransactionWithParametersJson(postgreService.pool, {
          destination: 'destination',
          source: 'source',
          parameters_json: {
            entrypoint: 'transfer',
            value: {
              transfer: {
                destination: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                tokens: '5',
              },
            },
          },
          jobId: fakeId,
          callerId: 'myCaller',
        }),
      ).rejects.toThrowError(
        Error(
          'insert or update on table "transaction" violates foreign key constraint "fk_job"',
        ),
      );
    });
  });

  describe('#selectTransaction', () => {
    let anotherJob: Jobs;

    beforeAll(async () => {
      const { rows: result } = await insertJob(postgreService.pool, {
        status: JobStatus.CREATED,
        rawTransaction: 'raw_transaction_2',
      });

      anotherJob = result[0];
    });

    beforeEach(async () => {
      await insertTransactions(
        postgreService.pool,
        [
          {
            kind: OpKind.TRANSACTION,
            destination: 'destination',
            amount: '10',
            fee: '10',
            storage_limit: '1000',
            gas_limit: '10000',
            counter: '1234567',
            source: 'source',
            parameters: {
              entrypoint: 'transfer',
              value: {
                prim: 'Pair',
                args: [
                  { string: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw' },
                  { int: '5' },
                ],
              },
            },
            parametersJson: {
              entrypoint: 'transfer',
              value: {
                transfer: {
                  destination: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                  tokens: '5',
                },
              },
            },
          },
        ],
        'branch_address',
        insertedJob.id,
        'myCaller',
      );

      await insertTransactions(
        postgreService.pool,
        [
          {
            kind: OpKind.TRANSACTION,
            destination: 'destination_2',
            amount: '20',
            fee: '20',
            storage_limit: '1000',
            gas_limit: '10000',
            counter: '1234567',
            source: 'source',
            parameters: {
              entrypoint: 'transfer',
              value: {
                prim: 'Pair',
                args: [
                  { string: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw' },
                  { int: '10' },
                ],
              },
            },
            parametersJson: {
              entrypoint: 'transfer',
              value: {
                transfer: {
                  destination: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                  tokens: '5',
                },
              },
            },
          },
        ],
        'branch_address_2',
        anotherJob.id,
        'myCaller',
      );
    });

    it('should correctly return all data in the database', async () => {
      const result = await selectTransaction(postgreService.pool, '*');
      expect(result).toEqual([
        {
          id: result[0].id,
          destination: 'destination',
          amount: 10,
          fee: 10,
          storage_limit: 1000,
          gas_limit: 10000,
          counter: 1234567,
          source: 'source',
          parameters:
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw"},{"int":"5"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"destination":"tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw","tokens":"5"}}}',
          job_id: insertedJob.id,
          branch: 'branch_address',
          caller_id: 'myCaller',
        },
        {
          id: result[1].id,
          destination: 'destination_2',
          amount: 20,
          fee: 20,
          storage_limit: 1000,
          gas_limit: 10000,
          counter: 1234567,
          source: 'source',
          parameters:
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw"},{"int":"10"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"destination":"tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw","tokens":"5"}}}',
          job_id: anotherJob.id,
          branch: 'branch_address_2',
          caller_id: 'myCaller',
        },
      ]);
    });

    it('should correctly work with select fields', async () => {
      const result = await selectTransaction(
        postgreService.pool,
        'destination, amount, job_id',
      );
      expect(result).toEqual([
        {
          destination: 'destination',
          amount: 10,
          job_id: insertedJob.id,
        },
        {
          destination: 'destination_2',
          amount: 20,
          job_id: anotherJob.id,
        },
      ]);
    });

    it('should correctly work with condition fields', async () => {
      const result = await selectTransaction(
        postgreService.pool,
        'destination, amount, job_id',
        `job_id = ${insertedJob.id}`,
      );
      expect(result).toEqual([
        {
          destination: 'destination',
          amount: 10,
          job_id: insertedJob.id,
        },
      ]);
    });
  });
});
