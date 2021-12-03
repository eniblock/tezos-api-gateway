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
  tezosNodeGranadaUrl,
} from '../../../__fixtures__/config';
import { resetTable, selectData } from '../../../__utils__/postgre';
import {
  activatedAccount,
  FA2Contract,
  flexibleTokenContract,
  revealedAccount,
  simpleContract,
  testAccount,
  testAccount2,
} from '../../../__fixtures__/smart-contract';
import { AddressNotRevealedError } from '../../../../src/const/errors/address-not-revealed';
import { RevealEstimateError } from '../../../../src/const/errors/reveal-estimate-error';
import { MaxOperationsPerBatchError } from '../../../../src/const/errors/max-operations-per-batch-error';

describe('[lib/jobs/forge-operation]', () => {
  const postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeGranadaUrl);

  beforeAll(async () => {
    await postgreService.initializeDatabase();
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.OPERATIONS);
    await resetTable(postgreService.pool, PostgreTables.JOBS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await postgreService.disconnect();
  });

  describe('#forgeOperation', () => {
    const testTransaction = {
      contractAddress: flexibleTokenContract,
      entryPoint: 'transfer',
      entryPointParams: {
        tokens: 1,
        destination: testAccount2,
      },
    };
    const testForgeOperation: ForgeOperationParams = {
      transactions: [
        testTransaction,
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
      publicKey: '',
      sourceAddress: testAccount,
      useCache: true,
      reveal: false,
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
          tableName: PostgreTables.OPERATIONS,
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
          tableName: PostgreTables.OPERATIONS,
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
          tableName: PostgreTables.OPERATIONS,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);
    });

    it('should throw AddressNotRevealedError when reveal is false and the address is not revealed', async () => {
      await expect(
        forgeOperation(
          {
            ...testForgeOperation,
            sourceAddress: activatedAccount.address,
            reveal: false,
          },
          tezosService,
          postgreService,
        ),
      ).rejects.toThrowError(AddressNotRevealedError);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.OPERATIONS,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);
    });

    it("should throw RevealEstimateError when reveal is true and the address isn't related to the publicKey", async () => {
      await expect(
        forgeOperation(
          {
            ...testForgeOperation,
            sourceAddress: activatedAccount.address,
            publicKey: revealedAccount.publicKey,
            reveal: true,
          },
          tezosService,
          postgreService,
        ),
      ).rejects.toThrowError(RevealEstimateError);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.OPERATIONS,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);
    });

    it('should throw MaxOperationsPerBatchError when number of transactions is 5 and reveal is needed', async () => {
      await expect(
        forgeOperation(
          {
            ...testForgeOperation,
            transactions: [
              testTransaction,
              testTransaction,
              testTransaction,
              testTransaction,
              testTransaction,
            ],
            sourceAddress: activatedAccount.address,
            publicKey: activatedAccount.publicKey,
            reveal: true,
          },
          tezosService,
          postgreService,
        ),
      ).rejects.toThrowError(MaxOperationsPerBatchError);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.OPERATIONS,
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
          tableName: PostgreTables.OPERATIONS,
          selectFields: '*',
        }),
      ).resolves.toEqual([]);
    });

    it('should correctly create a job and insert data to jobs and operations table when reveal is true and the address is already revealed', async () => {
      const createdJob = await forgeOperation(
        { ...testForgeOperation, reveal: true },
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
        tableName: PostgreTables.OPERATIONS,
        selectFields:
          'destination, parameters, parameters_json, amount, fee, source, storage_limit, gas_limit, counter, branch, job_id',
      });

      expect(insertedForgeParameters).toEqual([
        {
          destination: flexibleTokenContract,
          parameters:
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"' +
            testAccount2 +
            '"},{"int":"1"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"tokens":1,"destination":"' +
            testAccount2 +
            '"}}}',
          amount: 0,
          fee: 824,
          source: testAccount,
          storage_limit: 67,
          gas_limit: 4925,
          branch: insertedForgeParameters[0].branch,
          counter: insertedForgeParameters[0].counter,
          job_id: createdJob.id,
        },
        {
          destination: flexibleTokenContract,
          parameters:
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"' +
            testAccount2 +
            '"},{"int":"5"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"tokens":5,"destination":"' +
            testAccount2 +
            '"}}}',
          amount: 0,
          fee: 870,
          source: testAccount,
          storage_limit: 0,
          gas_limit: 5383,
          branch: insertedForgeParameters[1].branch,
          counter: insertedForgeParameters[1].counter,
          job_id: createdJob.id,
        },
      ]);

      expect(insertedForgeParameters[0].branch).not.toBeNull();
      expect(insertedForgeParameters[0].counter).not.toBeNull();

      expect(insertedForgeParameters[1].branch).not.toBeNull();
      expect(insertedForgeParameters[1].counter).not.toBeNull();
    });

    it('should correctly create a job and insert data to jobs and operations table', async () => {
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
        tableName: PostgreTables.OPERATIONS,
        selectFields:
          'destination, parameters, parameters_json, amount, fee, source, storage_limit, gas_limit, counter, branch, job_id',
      });

      expect(insertedForgeParameters).toEqual([
        {
          destination: flexibleTokenContract,
          parameters:
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"' +
            testAccount2 +
            '"},{"int":"1"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"tokens":1,"destination":"' +
            testAccount2 +
            '"}}}',
          amount: 0,
          fee: 824,
          source: testAccount,
          storage_limit: 67,
          gas_limit: 4925,
          branch: insertedForgeParameters[0].branch,
          counter: insertedForgeParameters[0].counter,
          job_id: createdJob.id,
        },
        {
          destination: flexibleTokenContract,
          parameters:
            '{"entrypoint":"transfer","value":{"prim":"Pair","args":[{"string":"' +
            testAccount2 +
            '"},{"int":"5"}]}}',
          parameters_json:
            '{"entrypoint":"transfer","value":{"transfer":{"tokens":5,"destination":"' +
            testAccount2 +
            '"}}}',
          amount: 0,
          fee: 870,
          source: testAccount,
          storage_limit: 0,
          gas_limit: 5383,
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

    it('should correctly create a job and insert data to jobs and operations table for the transaction and the reveal', async () => {
      const createdJob = await forgeOperation(
        {
          transactions: [
            {
              contractAddress: simpleContract,
              entryPoint: 'factorial',
              entryPointParams: 5,
            },
            {
              contractAddress: simpleContract,
              entryPoint: 'squareRoot',
              entryPointParams: 25,
            },
          ],
          callerId: 'TAG',
          publicKey: activatedAccount.publicKey,
          sourceAddress: activatedAccount.address,
          useCache: true,
          reveal: true,
        },
        tezosService,
        postgreService,
      );

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([createdJob]);

      const insertedTransactionsParameters = await selectData(
        postgreService.pool,
        {
          tableName: PostgreTables.OPERATIONS,
          selectFields:
            'destination, parameters, parameters_json, amount, fee, source, storage_limit, gas_limit, counter, branch, job_id, kind, public_key, caller_id',
        },
      );

      expect(insertedTransactionsParameters).toEqual([
        {
          destination: '',
          parameters: null,
          parameters_json: null,
          amount: null,
          fee: 374,
          source: activatedAccount.address,
          storage_limit: 0,
          gas_limit: 1100,
          branch: insertedTransactionsParameters[0].branch,
          counter: insertedTransactionsParameters[0].counter,
          job_id: createdJob.id,
          kind: 'reveal',
          public_key: activatedAccount.publicKey,
          caller_id: 'TAG',
        },
        {
          destination: simpleContract,
          parameters: '{"entrypoint":"factorial","value":{"int":"5"}}',
          parameters_json: '{"entrypoint":"factorial","value":{"factorial":5}}',
          amount: 0,
          fee: 566,
          source: activatedAccount.address,
          storage_limit: 0,
          gas_limit: 2459,
          branch: insertedTransactionsParameters[1].branch,
          counter: insertedTransactionsParameters[1].counter,
          job_id: createdJob.id,
          kind: 'transaction',
          public_key: null,
          caller_id: 'TAG',
        },
        {
          destination: simpleContract,
          parameters: '{"entrypoint":"squareRoot","value":{"int":"25"}}',
          parameters_json:
            '{"entrypoint":"squareRoot","value":{"squareRoot":25}}',
          amount: 0,
          fee: 566,
          source: activatedAccount.address,
          storage_limit: 0,
          gas_limit: 2459,
          branch: insertedTransactionsParameters[2].branch,
          counter: insertedTransactionsParameters[2].counter,
          job_id: createdJob.id,
          kind: 'transaction',
          public_key: null,
          caller_id: 'TAG',
        },
      ]);
    }, 8000);
  });
});
