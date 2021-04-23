import { logger } from '../../services/logger';
import { TezosService } from '../../services/tezos';
import { VaultSigner } from '../../services/signers/vault';
import { vaultClientConfig } from '../../config';
import { VaultClient } from '../../services/clients/vault-client';
import {
  createTezosAccountsByVaultKeys,
  createVaultKeys,
} from '../../scripts/activateTezosAccount/lib';

// const CREATE_ACCOUNTS_KNOWN_ERRORS = [ // TODO
//   '',
//   '',
// ];

/**
 * create, save and reveal a user Account
 *
 * @param {string} users                               - id of the account to be created
 * @param {string} secureKeyName                       - the secure key name
 * @param {object} tezosService                        - the tezos service
 *
 * @return Promise<object> the created job
 */
export async function createAccounts(
  users: string[],
  secureKeyName: string,
  tezosService: TezosService,
): Promise<any> {
  // TODO
  try {
    logger.info(
      {
        userId: users,
      },
      '[lib/user/createAccounts] Going to accounts for this following users',
    );

    // chech if a wallet already exist for this userId
    // TODO
    // logger.info(
    //     {  },
    //     '[lib/user/createAccounts] ',
    // );

    // create Vault Key
    const vaultClient = new VaultClient(vaultClientConfig, logger);
    await createVaultKeys(vaultClient, users);
    logger.info({ users }, '[lib/user/createAccounts] Created vault keys for ');

    // reveal account
    const vaultSigner = new VaultSigner(
      vaultClientConfig,
      secureKeyName,
      logger,
    );
    await createTezosAccountsByVaultKeys(
      tezosService,
      vaultSigner,
      users,
      logger,
    );
    // return userId and its address
    const result = await users.map(async (user) => {
      return {
        userId: user,
        account: await new VaultSigner(
          vaultClientConfig,
          user,
          logger,
        ).publicKeyHash(),
      };
    });
    logger.info(
      result,
      '[lib/user/createAccounts] Revealed accounts for the following users ',
    );

    return result;
  } catch (err) {
    // if (CREATE_ACCOUNTS_KNOWN_ERRORS.includes(err.constructor.name)) { // TODO
    //   throw err;
    // }

    logger.error(
      { error: err },
      '[lib/jobs/forgeOperation] Unexpected error happened',
    );

    throw err;
  }
}
