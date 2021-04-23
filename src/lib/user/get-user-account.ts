import { logger } from '../../services/logger';
import { GetUserResult } from '../../const/interfaces/user/get/get-user-result';
import { VaultClient } from '../../services/clients/vault-client';
import { vaultClientConfig } from '../../config';
import sodium from 'libsodium-wrappers';
import { b58cencode, prefix } from '@taquito/utils';
import { UndefinedPublicKeyError } from '../../const/errors/undefined-public-key-error';

/**
 * get user accounts from Vault
 *
 * @param {string} users                               - id of the account
 *
 */
export async function getUserAccounts(
  users: string[],
): Promise<GetUserResult[]> {
  try {
    logger.info(
      {
        userId: users,
      },
      '[lib/user/getUserAccounts] Going to get accounts for this following users',
    );

    const vaultClient = new VaultClient(vaultClientConfig, logger);
    return await Promise.all(
      (users as string[]).map(async (user) => {
        const publicKey = await vaultClient.getPublicKey(user);
        if (!publicKey) {
          throw new UndefinedPublicKeyError(user);
        }
        await sodium.ready;
        const bufferPublicKey = await Buffer.from(publicKey, 'base64');

        const pkh = b58cencode(
          sodium.crypto_generichash(20, new Uint8Array(bufferPublicKey)),
          prefix.tz1,
        );

        logger.info(
          { publicKeyHash: pkh },
          '[VaultSigner/publicKeyHash] Retrieved public key hash',
        );

        return {
          userId: user,
          account: pkh,
        };
      }),
    );
  } catch (err) {
    logger.error(
      { error: err },
      '[lib/user/getUserAccounts] Unexpected error happened',
    );

    throw err;
  }
}
