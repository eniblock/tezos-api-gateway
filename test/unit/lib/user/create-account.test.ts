import * as userLib from '../../../../src/lib/user/create-account';
import { VaultSigner } from '../../../../src/services/signers/vault';
jest.mock('../../../../src/services/signers/vault');

describe('[lib/user] Create account', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createAccounts', () => {
    it('should return the same number of created account as number of userId passed', async () => {
      jest.spyOn(userLib, 'createVaultKeys').mockImplementation();
      jest.spyOn(userLib, 'saveUserIdByAddresses').mockImplementation();

      const result = await userLib.createAccounts(['userId1', 'userId2']);

      expect(result.length).toEqual(2);
      expect(VaultSigner).toHaveBeenCalledTimes(2);
    });
  });
});
