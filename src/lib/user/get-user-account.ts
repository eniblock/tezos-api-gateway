import { logger } from '../../services/logger';
import { GetUserResult } from '../../const/interfaces/user/get/get-user-result';
import { VaultClient } from '../../services/clients/vault-client';
import { vaultClientConfig } from '../../config';
import sodium from 'libsodium-wrappers';
import { b58cencode, prefix } from '@taquito/utils';
import { ClientError } from '../../const/errors/client-error';
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
        let publicKey;
        try {
          publicKey = await vaultClient.getPublicKey(user);
        } catch (err) {
          if (err instanceof ClientError) {
            return {
              userId: user,
              account: null,
            };
          }
        }
        if (!publicKey) {
          throw new UndefinedPublicKeyError(user);
        }

        const pkh = await publicKeyHashed(publicKey);

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

export async function getSelfManagedUserAccounts(users: string[]) {
  logger.info(
    {
      userId: users,
    },
    '[lib/user/getUserAccounts] Going to get accounts for self-managed users',
  );

  try {
    const vaultClient = new VaultClient(vaultClientConfig, logger);
    const userIdFromVault = await vaultClient.getSecretMetadataList(
      'self-managed',
    );

    return await Promise.all(
      users.map(async (user) => {
        if (!userIdFromVault.includes(user)) {
          return {
            userId: user,
            account: null,
          };
        }

        const publicKeyHash = await vaultClient.getSecret(
          'self-managed',
          user,
          'publicKey',
        );
        if (publicKeyHash === undefined)
          throw new UndefinedPublicKeyError(user);

        logger.info(
          { publicKeyHash },
          '[VaultSigner/publicKeyHash] Retrieved public key hash',
        );

        return {
          userId: user,
          account: publicKeyHash,
        };
      }),
    );
  } catch (err) {
    logger.error(
      { error: err },
      '[lib/user/getUserAccounts] An Unexpected error happened',
    );

    throw err;
  }
}

async function publicKeyHashed(publicKey: string) {
  await sodium.ready;
  const bufferPublicKey = await Buffer.from(publicKey, 'base64');

  return b58cencode(
    sodium.crypto_generichash(20, new Uint8Array(bufferPublicKey)),
    prefix.tz1,
  );
}
