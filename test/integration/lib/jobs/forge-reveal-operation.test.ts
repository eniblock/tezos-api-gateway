import { PostgreService } from '../../../../src/services/postgre';
import { PostgreTables } from '../../../../src/const/postgre/postgre-tables';
import { postgreConfig, tezosNodeUrls } from '../../../__fixtures__/config';
import { resetTable, selectData } from '../../../__utils__/postgre';
import { GatewayPool } from '../../../../src/services/gateway-pool';
import { logger } from '../../../__fixtures__/services/logger';
import { forgeRevealOperation } from '../../../../src/lib/jobs/forge-reveal-operation';
import { AddressAlreadyRevealedError } from '../../../../src/const/errors/address-already-revealed';
import { RevealEstimateError } from '../../../../src/const/errors/reveal-estimate-error';
import {
  activatedAccount,
  revealedAccount,
  unActivatedAccount,
} from '../../../__fixtures__/smart-contract';

describe('[lib/jobs/forge-operation]', () => {
  const postgreService = new PostgreService(postgreConfig);
  const gatewayPool = new GatewayPool(tezosNodeUrls, logger);

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

  describe('#forgeRevealOperation', () => {
    it('should throw AddressAlreadyRevealedError when the address is already revealed', async () => {
      await expect(
        forgeRevealOperation(
          gatewayPool,
          postgreService,
          revealedAccount.address,
          revealedAccount.publicKey,
          'callerId',
        ),
      ).rejects.toThrowError(AddressAlreadyRevealedError);

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

    it("should throw RevealEstimateError when address isn't activated", async () => {
      await expect(
        forgeRevealOperation(
          gatewayPool,
          postgreService,
          unActivatedAccount.address,
          unActivatedAccount.publicKey,
          'callerId',
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
    }, 8000);

    it("should throw RevealEstimateError when address isn't related to the public key", async () => {
      await expect(
        forgeRevealOperation(
          gatewayPool,
          postgreService,
          unActivatedAccount.address,
          revealedAccount.publicKey,
          'callerId',
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

    it('should correctly create a job and insert data to jobs table', async () => {
      const { gas, fee, ...job } = await forgeRevealOperation(
        gatewayPool,
        postgreService,
        activatedAccount.address,
        activatedAccount.publicKey,
        'callerId',
      );

      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([job]);

      const operation = await selectData(postgreService.pool, {
        tableName: PostgreTables.OPERATIONS,
        selectFields:
          'fee, source, storage_limit, gas_limit, counter, branch, job_id, public_key, kind, caller_id',
      });

      expect(operation).toEqual([
        {
          fee: 374,
          source: activatedAccount.address,
          storage_limit: 0,
          gas_limit: 1100,
          branch: operation[0].branch,
          counter: operation[0].counter,
          job_id: job.id,
          public_key: activatedAccount.publicKey,
          kind: 'reveal',
          caller_id: 'callerId',
        },
      ]);
    }, 10000);

    it('should correctly create a job with the specified fee, when fee parameter is set', async () => {
      const { gas, fee, ...job } = await forgeRevealOperation(
        gatewayPool,
        postgreService,
        activatedAccount.address,
        activatedAccount.publicKey,
        'callerId',
        500,
      );

      expect(fee).toEqual(500);
      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([job]);

      const operation = await selectData(postgreService.pool, {
        tableName: PostgreTables.OPERATIONS,
        selectFields:
          'fee, source, storage_limit, gas_limit, counter, branch, job_id, public_key, kind, caller_id',
      });

      expect(operation[0].fee).toEqual(500);
    }, 10000);

    it('should correctly create a job with estimated fee, when fee parameter is set to 0', async () => {
      const { gas, fee, ...job } = await forgeRevealOperation(
        gatewayPool,
        postgreService,
        activatedAccount.address,
        activatedAccount.publicKey,
        'callerId',
        0,
      );

      expect(fee).toBeGreaterThan(0);
      await expect(
        selectData(postgreService.pool, {
          tableName: PostgreTables.JOBS,
          selectFields: '*',
        }),
      ).resolves.toEqual([job]);

      const operation = await selectData(postgreService.pool, {
        tableName: PostgreTables.OPERATIONS,
        selectFields:
          'fee, source, storage_limit, gas_limit, counter, branch, job_id, public_key, kind, caller_id',
      });

      expect(operation[0].fee).toBeGreaterThan(0);
    }, 10000);
  });
});
