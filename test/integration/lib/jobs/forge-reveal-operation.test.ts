import { PostgreService } from '../../../../src/services/postgre';
import { PostgreTables } from '../../../../src/const/postgre/postgre-tables';
import {
  postgreConfig,
  tezosNodeGranadaUrls,
} from '../../../__fixtures__/config';
import { resetTable, selectData } from '../../../__utils__/postgre';
import { GatewayPool } from '../../../../src/services/gateway-pool';
import { logger } from '../../../__fixtures__/services/logger';
import { forgeRevealOperation } from '../../../../src/lib/jobs/forge-reveal-operation';
import { AddressAlreadyRevealedError } from '../../../../src/const/errors/address-already-revealed';
import { RevealEstimateError } from '../../../../src/const/errors/reveal-estimate-error';

describe('[lib/jobs/forge-operation]', () => {
  const postgreService = new PostgreService(postgreConfig);
  const gatewayPool = new GatewayPool(tezosNodeGranadaUrls, logger);

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
    const revealedAccount = {
      address: 'tz1ZVXhWWhj9CjviLDRyS8nbMGtm3StnMCaZ',
      publicKey: 'edpkuJpbmRrKVbXHWmJAU5v9YKiA1PCiy1xo1UyAKeUjpSvkXM5wfe',
    };
    const unActivatedAccount = {
      address: 'tz1YqMAEcChYsD8tVCJY7gTEEMqbtbSZPUsG',
      publicKey: 'edpkuuzYpzP54bqH67uCSwPWEU1sY8TqsPD38tDCNS8azmCwSJm62T',
    };

    it('should throw AddressAlreadyRevealedError when the address is already revealed', async () => {
      await expect(
        forgeRevealOperation(
          gatewayPool,
          postgreService,
          revealedAccount.address,
          revealedAccount.publicKey,
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

    it("should throw RevealEstimateError when address isn't related to the public key", async () => {
      await expect(
        forgeRevealOperation(
          gatewayPool,
          postgreService,
          unActivatedAccount.address,
          revealedAccount.publicKey,
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
  });
});
