import { ContractResponse } from '@taquito/rpc';

import { PostgreService } from '../../../../src/services/postgre';
import { PostgreTables } from '../../../../src/const/postgre/postgre-tables';
import { forgeOperation } from '../../../../src/lib/jobs/forge-operation';
import { TezosService } from '../../../../src/services/tezos';
import { ForgeOperationParams } from '../../../../src/const/interfaces/forge-operation-params';
import { AddressNotFoundError } from '../../../../src/const/errors/address-not-found-error';
import {
  InvalidEntryPointParams,
  InvalidMapStructureParams,
} from '../../../../src/const/errors/invalid-entry-point-params';

import {
  postgreConfig,
  tezosNodeEdonetUrl,
} from '../../../__fixtures__/config';
import { resetTable, selectData } from '../../../__utils__/postgre';
import {
  FA2Contract,
  flexibleTokenContract,
  testAccount,
  testAccount2,
} from '../../../__fixtures__/smart-contract';

describe('[lib/jobs/forge-operation]', () => {
  const postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeEdonetUrl);

  beforeAll(async () => {
    await postgreService.initializeDatabase();
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.TRANSACTION);
    await resetTable(postgreService.pool, PostgreTables.JOBS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await postgreService.disconnect();
  });

  describe('#forgeOperation', () => {
    const testForgeOperation: ForgeOperationParams = {
      transactions: [
        {
          contractAddress: flexibleTokenContract,
          entryPoint: 'transfer',
          entryPointParams: {
            tokens: 1,
            destination: testAccount2,
          },
        },
        {
          contractAddress: flexibleTokenContract,
          entryPoint: 'transfer',
          entryPointParams: {
            tokens: 5,
            destination: testAccount2,
          },
        },
      ],
      callerId: 'myCaller',
      sourceAddress: testAccount,
    };

    it('should throw AddressNotFoundError when source address is not correct (no counter in the response)', async () => {
      jest
        .spyOn(tezosService, 'getContractResponse')
        .mockResolvedValue(({} as unknown) as ContractResponse);
      await expect(
        forgeOperation(testForgeOperation, tezosService, postgreService),
      ).rejects.toThrowError(AddressNotFoundError);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.TRANSACTION,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);
    });

    it('should throw InvalidEntryPointParams when entry point parameters does not match entry schema', async () => {
      await expect(
        forgeOperation(
          {
            ...testForgeOperation,
            transactions: [
              {
                contractAddress: flexibleTokenContract,
                entryPoint: 'transfer',
                entryPointParams: {
                  fakeParam: 5,
                  destination: testAccount2,
                },
              },
            ],
          },
          tezosService,
          postgreService,
        ),
      ).rejects.toThrowError(InvalidEntryPointParams);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.TRANSACTION,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);
    });

    it('should throw InvalidMapStructureParams when entry point parameters does not match entry schema', async () => {
      await expect(
        forgeOperation(
          {
            ...testForgeOperation,
            transactions: [
              {
                contractAddress: FA2Contract,
                entryPoint: 'mint',
                entryPointParams: {
                  amount: 100,
                  address: testAccount,
                  token_id: 1,
                  metadata: {
                    key: 'name',
                    value: '54686520546f6b656e204f6e65',
                  },
                },
              },
            ],
          },
          tezosService,
          postgreService,
        ),
      ).rejects.toThrowError(InvalidMapStructureParams);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.TRANSACTION,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);
    });

    it('should throw the error when the error happen', async () => {
      await expect(
        forgeOperation(
          {
            ...testForgeOperation,
            transactions: [
              {
                contractAddress: flexibleTokenContract,
                entryPoint: 'transfer',
                entryPointParams: {
                  tokens: 'this is a token',
                  destination: testAccount2,
                },
              },
            ],
          },
          tezosService,
          postgreService,
        ),
      ).rejects.toHaveProperty('name', 'NatValidationError');

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.TRANSACTION,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);
    });

    it('should correctly create a job and insert data to jobs and forge_parameters table', async () => {
      const createdJob = await forgeOperation(
        testForgeOperation,
        tezosService,
        postgreService,
      );

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([createdJob]);

      const insertedForgeParameters = await selectData(postgreService.pool, {
        tableName: PostgreTables.TRANSACTION,
        selectFields:
          'destination, parameters, parameters_json, amount, fee, source, storage_limit, gas_limit, counter, branch, job_id',
      });

      expect(insertedForgeParameters).toEqual([
        {
          destination: flexibleTokenContract,
          parameters:
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"' + testAccount2 + '"},{"int":"1"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"tokens":1,"destination":"' + testAccount2 + '"}}}',
          amount: 0,
          fee: 2052,
          source: testAccount,
          storage_limit: 0,
          gas_limit: 17203,
          branch: insertedForgeParameters[0].branch,
          counter: insertedForgeParameters[0].counter,
          job_id: createdJob.id,
        },
        {
          destination: flexibleTokenContract,
          parameters:
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"' + testAccount2 + '"},{"int":"5"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"tokens":5,"destination":"' + testAccount2 + '"}}}',
          amount: 0,
          fee: 2052,
          source: testAccount,
          storage_limit: 0,
          gas_limit: 17203,
          branch: insertedForgeParameters[1].branch,
          counter: insertedForgeParameters[1].counter,
          job_id: createdJob.id,
        },
      ]);

      expect(insertedForgeParameters[0].branch).not.toBeNull();
      expect(insertedForgeParameters[0].counter).not.toBeNull();

      expect(insertedForgeParameters[1].branch).not.toBeNull();
      expect(insertedForgeParameters[1].counter).not.toBeNull();
    }, 8000);
  });
});
