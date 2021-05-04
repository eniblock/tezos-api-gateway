import nock from 'nock';
import { resetTable } from '../../../__utils__/postgre';
import {
  postgreConfig,
  tezosNodeEdonetUrl,
  tezosNodeEdonetUrls,
} from '../../../__fixtures__/config';
import { logger } from '../../../__fixtures__/services/logger';
import { PostgreService } from '../../../../src/services/postgre';
import { TezosService } from '../../../../src/services/tezos';
import { PostgreTables } from '../../../../src/const/postgre/postgre-tables';
import { vaultClientConfig } from '../../../../src/config';
import { GatewayPool } from '../../../../src/services/gateway-pool';
import * as userLib from '../../../../src/lib/user/create-account';
import { VaultSigner } from '../../../../src/services/signers/vault';
import { VaultClient } from '../../../../src/services/clients/vault-client';

describe('[lib/user-create-account] create Tezos accounts', () => {
  const postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeEdonetUrl);
  const gatewayPool = new GatewayPool(tezosNodeEdonetUrls, logger);

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

  describe('#createAccounts', () => {
    beforeEach(async () => {
      jest
        .spyOn(gatewayPool, 'getTezosService')
        .mockResolvedValue(tezosService);
    });

    beforeAll(async () => {
      const vaultClient = new VaultClient(vaultClientConfig, logger);
      await vaultClient.createKey('toto');
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should return 404 when vault signer return 404', async () => {
      await expect(
        userLib.createAccounts(
          {
            secureKeyName: 'nonExistingKey',
            userIdList: ['user1', 'user2'],
          },
          tezosService,
        ),
      ).rejects.toThrow(Error('{"errors":[]}'));
    });

    it('should correctly create accounts and return the corresponding addresses', async () => {
      jest
        .spyOn(userLib, 'createTezosAccountsByVaultKeys')
        .mockImplementation(
          async (
            tezService: TezosService,
            signer: VaultSigner,
            vaultKeys: string[],
          ) => {
            logger.info(
              { tezService, signer, vaultKeys },
              '[test/lib/user/createTezosAccountsByVaultKeys] mocking the createTezosAccountsByVaultKeys function',
            );
          },
        );

      const accounts = await userLib.createAccounts(
        {
          userIdList: ['user1', 'user2'],
          secureKeyName: 'toto',
        },
        tezosService,
      );

      expect(accounts[0].userId).toEqual('user1');
      expect(accounts[0].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      expect(accounts[1].userId).toEqual('user2');
      expect(accounts[1].account).toMatch(/tz[0-9a-zA-Z]{34}/);
    });
  });
});
