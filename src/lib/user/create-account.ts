import { logger } from '../../services/logger';
import { TezosService } from '../../services/tezos';
import { VaultSigner } from '../../services/signers/vault';
import { vaultClientConfig } from '../../config';
import { VaultClient } from '../../services/clients/vault-client';
import {
  createTezosAccountsByVaultKeys,
  // createTezosAccountsByVaultKeys,
  createVaultKeys,
} from '../../scripts/activateTezosAccount/lib';
import { CreateUserResult } from '../../const/interfaces/user/create/create-user-result';
import { CreateUserParams } from '../../const/interfaces/user/create/create-user-params';

/**
 * create, save and reveal a user Account
 *
 * @param {string} userIdList                               - id of the account to be created
 * @param {string} secureKeyName                       - the secure key name
 * @param {object} tezosService                        - the tezos service
 *
 * @return Promise<object> the created job
 */
export async function createAccounts(
  { userIdList, secureKeyName }: CreateUserParams,
  tezosService: TezosService,
): Promise<CreateUserResult[]> {
  try {
    logger.info(
      { userIdList },
      '[lib/user/createAccounts] Going to accounts for this following users',
    );

    const vaultClient = new VaultClient(vaultClientConfig, logger);
    await createVaultKeys(vaultClient, userIdList);
    logger.info(
      { userIdList },
      '[lib/user/createAccounts] Created vault keys for ',
    );

    const vaultSigner = new VaultSigner(
      vaultClientConfig,
      secureKeyName,
      logger,
    );

    await createTezosAccountsByVaultKeys(
      tezosService,
      vaultSigner,
      userIdList,
      logger,
    );

    logger.info(
      { secureKeyName },
      '[lib/user/createAccounts] Revealed accounts by transferring some XTZ from the account ',
    );

    const result = await Promise.all(
      userIdList.map(async (user) => {
        return {
          userId: user,
          account: await new VaultSigner(
            vaultClientConfig,
            user,
            logger,
          ).publicKeyHash(),
        };
      }),
    );

    logger.info(
      result,
      '[lib/user/createAccounts] Revealed accounts for the following users ',
    );

    return result;
  } catch (err) {
    logger.error(
      { error: err },
      '[lib/user/createAccounts] Unexpected error happened',
    );

    throw err;
  }
}
