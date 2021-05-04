import * as userLib from '../../../../src/lib/user/get-user-account';
import { logger } from '../../../__fixtures__/services/logger';
import { VaultClient } from '../../../../src/services/clients/vault-client';
import { vaultClientConfig } from '../../../../src/config';

describe('[lib/user/get-user-account]', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#getUserAccounts', () => {
    beforeAll(async () => {
      const vaultClient = new VaultClient(vaultClientConfig, logger);
      await vaultClient.createKey('user1');
      await vaultClient.createKey('user2');
    });

    it('should return the account addresses of the specified users', async () => {
      const accounts = await userLib.getUserAccounts(['user1', 'user2']);

      expect(accounts[0].userId).toEqual('user1');
      expect(accounts[0].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      expect(accounts[1].userId).toEqual('user2');
      expect(accounts[1].account).toMatch(/tz[0-9a-zA-Z]{34}/);
    });

    it('should throw an error and log error if unexpected error happened', async () => {
      jest
        .spyOn(userLib, 'getUserAccounts')
        .mockRejectedValue(new Error('Unexpected error'));

      await expect(userLib.getUserAccounts(['user1', 'user2'])).rejects.toThrow(
        Error('Unexpected error'),
      );
    });

    it('should return a null account address for an unknown user Id ', async () => {
      const accounts = await userLib.getUserAccounts(['user1', 'user3']);

      expect(accounts[0].userId).toEqual('user1');
      expect(accounts[0].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      expect(accounts[1].userId).toEqual('user3');
      expect(accounts[1].account).toEqual(null);
    });
  });
});
