import { logger } from '../../services/logger';
import { GetUserResult } from '../../const/interfaces/user/get/get-user-result';
import { VaultClient } from '../../services/clients/vault-client';
import { vaultClientConfig } from '../../config';
import { ClientError } from '../../const/errors/client-error';
import { UndefinedUserIdError } from '../../const/errors/undefined-user-id';

/**
 * get user identifiers from Vault
 *
 * @param {string} addresses                               - Tezos addresses of the users
 *
 */
export async function getUserByAddress(
  addresses: string[],
): Promise<GetUserResult[]> {
  try {
    logger.info(
      {
        userAddresses: addresses,
      },
      '[lib/user/getUserByAddress] Going to get accounts for this following addresses',
    );

    const vaultClient = new VaultClient(vaultClientConfig, logger);
    return await Promise.all(
      addresses.map(async (address) => {
        let id;
        try {
          id = await vaultClient.getSecret('accounts', address);
        } catch (err) {
          if (err instanceof ClientError) {
            return {
              userId: null,
              account: address,
            };
          }
        }
        if (!id) {
          throw new UndefinedUserIdError(address);
        }

        return {
          userId: id,
          account: address,
        };
      }),
    );
  } catch (err) {
    logger.error(
      { error: err },
      '[lib/user/getUserByAddress] Unexpected error happened',
    );

    throw err;
  }
}
