import { OpKind } from '@taquito/rpc';

import {
  flexibleTokenContract,
  signature,
  signedTransaction,
  testAccount,
} from '../../../__fixtures__/smart-contract';
import {
  postgreConfig,
  tezosNodeEdonetUrl,
  tezosNodeEdonetUrls,
} from '../../../__fixtures__/config';
import { logger } from '../../../__fixtures__/services/logger';
import { resetTable, selectData } from '../../../__utils__/postgre';

import { PostgreService } from '../../../../src/services/postgre';
import { PostgreTables } from '../../../../src/const/postgre/postgre-tables';
import { TezosService } from '../../../../src/services/tezos';
import { ForgeOperationParams } from '../../../../src/const/interfaces/forge-operation-params';
import { Jobs } from '../../../../src/const/interfaces/jobs';
import { injectOperation } from '../../../../src/lib/jobs/inject-operation';
import * as jobModel from '../../../../src/models/jobs';
import { selectTransaction } from '../../../../src/models/transactions';
import { JobIdNotFoundError } from '../../../../src/const/errors/job-id-not-found-error';
import { Transaction } from '../../../../src/const/interfaces/transaction';
import { forgeOperation } from '../../../../src/lib/jobs/forge-operation';
import { GatewayPool } from '../../../../src/services/gateway-pool';

describe('[lib/jobs/inject-operation]', () => {
  const postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeEdonetUrl);
  const gatewayPool = new GatewayPool(tezosNodeEdonetUrls, logger);

  beforeAll(async () => {
    await postgreService.initializeDatabase();
  });

  beforeEach(async () => {
    await resetTable(postgreService.pool, PostgreTables.TRANSACTION);
    await resetTable(postgreService.pool, PostgreTables.JOBS);

    jest.spyOn(gatewayPool, 'getTezosService').mockResolvedValue(tezosService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await postgreService.disconnect();
  });

  describe('#injectOperation', () => {
    const testForgeOperation: ForgeOperationParams = {
      transactions: [
        {
          contractAddress: flexibleTokenContract,
          entryPoint: 'transfer',
          entryPointParams: {
            tokens: 1,
            destination: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
          },
        },
        {
          contractAddress: flexibleTokenContract,
          entryPoint: 'lock',
        },
      ],
      sourceAddress: testAccount,
    };

    let insertedJob: Jobs;
    let tezosInjectOperationSpy: jest.SpyInstance;
    let tezosPreapplyOperationSpy: jest.SpyInstance;

    beforeEach(async () => {
      const estimation = [
        {
          suggestedFeeMutez: 50,
          storageLimit: 50,
          gasLimit: 50,
        },
        {
          suggestedFeeMutez: 100,
          storageLimit: 50,
          gasLimit: 100,
        },
      ];

      jest
        .spyOn(tezosService.tezos.estimate, 'batch')
        .mockResolvedValue(estimation as any);

      insertedJob = await forgeOperation(
        testForgeOperation,
        tezosService,
        postgreService,
      );

      tezosInjectOperationSpy = jest
        .spyOn(tezosService, 'injectedOperations')
        .mockResolvedValue('operation_hash');
      tezosPreapplyOperationSpy = jest
        .spyOn(tezosService, 'preapplyOperations')
        .mockImplementation();
    });

    it('should throw JobIdNotFoundError with correct message when there is no corresponding job id in forge parameters table', async () => {
      await resetTable(postgreService.pool, PostgreTables.TRANSACTION);
      await expect(
        injectOperation(
          { gatewayPool, postgreService },
          { jobId: insertedJob.id, signature, signedTransaction },
        ),
      ).rejects.toThrow(
        new JobIdNotFoundError(
          `Could not find the forge parameter with this job id: ${insertedJob.id}`,
        ),
      );

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([insertedJob]);

      expect(tezosInjectOperationSpy.mock.calls).toEqual([]);
      expect(tezosPreapplyOperationSpy.mock.calls).toEqual([]);
    });

    it('should throw JobIdNotFoundError with correct message when there is no job with this job id', async () => {
      const transactions: Transaction[] = await selectTransaction(
        postgreService.pool,
        '*',
        `job_id = ${insertedJob.id}`,
      );
      jest.spyOn(jobModel, 'updateOperationHash').mockResolvedValue([]);

      await expect(
        injectOperation(
          { gatewayPool, postgreService },
          { jobId: insertedJob.id, signature, signedTransaction },
        ),
      ).rejects.toThrow(
        new JobIdNotFoundError(
          `Could not find job with this id: ${insertedJob.id}`,
        ),
      );

      expect(tezosInjectOperationSpy.mock.calls).toEqual([[signedTransaction]]);
      expect(tezosPreapplyOperationSpy.mock.calls).toEqual([
        [
          transactions[0].branch,
          [
            {
              kind: OpKind.TRANSACTION,
              destination: flexibleTokenContract,
              parameters: {
                entrypoint: 'transfer',
                value: {
                  args: [
                    {
                      string: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                    },
                    {
                      int: '1',
                    },
                  ],
                  prim: 'Pair',
                },
              },
              amount: '0',
              fee: '50',
              source: testAccount,
              storage_limit: '50',
              gas_limit: '50',
              counter: transactions[0].counter!.toString(),
            },
            {
              kind: OpKind.TRANSACTION,
              destination: flexibleTokenContract,
              parameters: {
                entrypoint: 'lock',
                value: {
                  prim: 'Unit',
                },
              },
              amount: '0',
              fee: '100',
              source: testAccount,
              storage_limit: '50',
              gas_limit: '100',
              counter: transactions[1].counter!.toString(),
            },
          ],
          signature,
        ],
      ]);
    });

    it('should correctly update the database and inject the operation', async () => {
      const transactions: Transaction[] = await selectTransaction(
        postgreService.pool,
        '*',
        `job_id = ${insertedJob.id}`,
      );
      await expect(
        injectOperation(
          { gatewayPool, postgreService },
          { jobId: insertedJob.id, signature, signedTransaction },
        ),
      ).resolves.toBeUndefined();

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([
        {
          ...insertedJob,
          status: 'published',
          operation_hash: 'operation_hash',
        },
      ]);

      expect(tezosInjectOperationSpy.mock.calls).toEqual([[signedTransaction]]);
      expect(tezosPreapplyOperationSpy.mock.calls).toEqual([
        [
          transactions[0].branch,
          [
            {
              kind: OpKind.TRANSACTION,
              destination: flexibleTokenContract,
              parameters: {
                entrypoint: 'transfer',
                value: {
                  args: [
                    {
                      string: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                    },
                    {
                      int: '1',
                    },
                  ],
                  prim: 'Pair',
                },
              },
              amount: '0',
              fee: '50',
              source: testAccount,
              storage_limit: '50',
              gas_limit: '50',
              counter: transactions[0].counter!.toString(),
            },
            {
              kind: OpKind.TRANSACTION,
              destination: flexibleTokenContract,
              parameters: {
                entrypoint: 'lock',
                value: {
                  prim: 'Unit',
                },
              },
              amount: '0',
              fee: '100',
              source: testAccount,
              storage_limit: '50',
              gas_limit: '100',
              counter: transactions[1].counter!.toString(),
            },
          ],
          signature,
        ],
      ]);
    });
  });
});
