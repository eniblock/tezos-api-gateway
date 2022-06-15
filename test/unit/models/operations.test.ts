import { OpKind } from '@taquito/rpc';
import { Settings } from 'luxon';

import { postgreConfig } from '../../__fixtures__/config';
import { resetTable, selectData } from '../../__utils__/postgre';
import { PostgreService } from '../../../src/services/postgre';
import { insertJob } from '../../../src/models/jobs';
import {
  insertOperations,
  insertTransaction,
  selectOperation,
} from '../../../src/models/operations';
import { PostgreTables } from '../../../src/const/postgre/postgre-tables';
import { Jobs } from '../../../src/const/interfaces/jobs';
import { JobStatus } from '../../../src/const/job-status';
import { testAccount2 } from '../../__fixtures__/smart-contract';

describe('[models/operations]', () => {
  const postgreService = new PostgreService(postgreConfig);
  let insertedJob: Jobs;
  const oldNow = Settings.now;

  beforeAll(async () => {
    Settings.now = () => new Date(2022, 3, 28).valueOf();
    await postgreService.initializeDatabase();

    const { rows: result } = await insertJob(postgreService.pool, {
      status: JobStatus.CREATED,
      forged_operation: 'forged_operation',
      operation_kind: OpKind.TRANSACTION,
    });

    insertedJob = result[0];
  });

  afterAll(async () => {
    await postgreService.disconnect();
    Settings.now = oldNow;
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.OPERATIONS);
  });

  describe('#insertTransaction', () => {
    it('should correctly insert the data', async () => {
      const { rows: insertedResult } = await insertOperations(
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
                args: [{ string: testAccount2 }, { int: '5' }],
              },
            },
            parametersJson: {
              entrypoint: 'transfer',
              value: {
                transfer: {
                  destination: testAccount2,
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
                args: [{ string: testAccount2 }, { int: '10' }],
              },
            },
            parametersJson: {
              entrypoint: 'transfer',
              value: {
                transfer: {
                  destination: testAccount2,
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
          tableName: PostgreTables.OPERATIONS,
          selectFields: '*',
        }),
      ).resolves.toMatchObject([
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
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"' +
            testAccount2 +
            '"},{"int":"5"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"destination":"' +
            testAccount2 +
            '","tokens":"5"}}}',
          job_id: insertedJob.id,
          branch: 'branch_address',
          caller_id: 'myCaller',
          kind: OpKind.TRANSACTION,
          public_key: null,
          update_date: null,
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
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"' +
            testAccount2 +
            '"},{"int":"10"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"destination":"' +
            testAccount2 +
            '","tokens":"10"}}}',
          job_id: insertedJob.id,
          branch: 'branch_address',
          caller_id: 'myCaller',
          kind: OpKind.TRANSACTION,
          public_key: null,
          update_date: null,
        },
      ]);
    });

    it('should throw error when job id does not exist', async () => {
      const fakeId = insertedJob.id + 1;
      await expect(
        insertOperations(
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
                  args: [{ string: testAccount2 }, { int: '5' }],
                },
              },
              parametersJson: {
                entrypoint: 'transfer',
                value: {
                  transfer: {
                    destination: testAccount2,
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
          'insert or update on table "operations" violates foreign key constraint "fk_job"',
        ),
      );
    });
  });

  describe('#insertTransactionWithParametersJson', () => {
    it('should correctly insert the data', async () => {
      const { rows: insertedResult } = await insertTransaction(
        postgreService.pool,
        {
          destination: 'destination',
          source: 'source',
          parameters_json: {
            entrypoint: 'transfer',
            value: {
              transfer: {
                destination: testAccount2,
                tokens: '5',
              },
            },
          },
          amount: 0,
          jobId: insertedJob.id,
          callerId: 'myCaller',
        },
      );

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.OPERATIONS,
          selectFields: '*',
        }),
      ).resolves.toMatchObject([
        {
          id: insertedResult[0].id,
          destination: 'destination',
          amount: 0,
          fee: null,
          storage_limit: null,
          gas_limit: null,
          counter: null,
          source: 'source',
          parameters: null,
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"destination":"' +
            testAccount2 +
            '","tokens":"5"}}}',
          job_id: insertedJob.id,
          branch: null,
          caller_id: 'myCaller',
          kind: OpKind.TRANSACTION,
          public_key: null,
          update_date: null,
        },
      ]);
    });

    it('should throw error when job id does not exist', async () => {
      const fakeId = insertedJob.id + 1;
      await expect(
        insertTransaction(postgreService.pool, {
          destination: 'destination',
          source: 'source',
          parameters_json: {
            entrypoint: 'transfer',
            value: {
              transfer: {
                destination: testAccount2,
                tokens: '5',
              },
            },
          },
          amount: 0,
          jobId: fakeId,
          callerId: 'myCaller',
        }),
      ).rejects.toThrowError(
        Error(
          'insert or update on table "operations" violates foreign key constraint "fk_job"',
        ),
      );
    });
  });

  describe('#selectOperation', () => {
    let anotherJob: Jobs;

    beforeAll(async () => {
      const { rows: result } = await insertJob(postgreService.pool, {
        status: JobStatus.CREATED,
        forged_operation: 'forged_operation_2',
        operation_kind: OpKind.TRANSACTION,
      });

      anotherJob = result[0];
    });

    beforeEach(async () => {
      await insertOperations(
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
                args: [{ string: testAccount2 }, { int: '5' }],
              },
            },
            parametersJson: {
              entrypoint: 'transfer',
              value: {
                transfer: {
                  destination: testAccount2,
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

      await insertOperations(
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
                args: [{ string: testAccount2 }, { int: '10' }],
              },
            },
            parametersJson: {
              entrypoint: 'transfer',
              value: {
                transfer: {
                  destination: testAccount2,
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
      const result = await selectOperation(postgreService.pool, '*');
      expect(result).toMatchObject([
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
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"' +
            testAccount2 +
            '"},{"int":"5"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"destination":"' +
            testAccount2 +
            '","tokens":"5"}}}',
          job_id: insertedJob.id,
          branch: 'branch_address',
          caller_id: 'myCaller',
          kind: OpKind.TRANSACTION,
          public_key: null,
          update_date: null,
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
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"' +
            testAccount2 +
            '"},{"int":"10"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"destination":"' +
            testAccount2 +
            '","tokens":"5"}}}',
          job_id: anotherJob.id,
          branch: 'branch_address_2',
          caller_id: 'myCaller',
          kind: OpKind.TRANSACTION,
          public_key: null,
          update_date: null,
        },
      ]);
    });

    it('should correctly work with select fields', async () => {
      const result = await selectOperation(
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
      const result = await selectOperation(
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
