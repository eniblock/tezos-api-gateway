import { logger } from '../../services/logger';
import { TezosService } from '../../services/tezos';
import { VaultSigner } from '../../services/signers/vault';
import { transferAmount, vaultClientConfig } from '../../config';
import { VaultClient } from '../../services/clients/vault-client';
import { CreateUserResult } from '../../const/interfaces/user/create/create-user-result';
import { CreateUserParams } from '../../const/interfaces/user/create/create-user-params';
import { Signer } from '@taquito/taquito';

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

    await createTezosAccountsByVaultKeys(tezosService, vaultSigner, userIdList);

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

/**
 * Create and store the keys in vault
 *
 * @param {object} vaultClient - the vault client to create keys
 * @param {string[]} vaultKeys - the list of vault keys going to be created
 *
 * @return {Promise<void>}
 *
 * The reason why the function is declared as an expression is to be able to mock it in unit tests
 * reference: https://github.com/facebook/jest/issues/936#issuecomment-545080082
 */
export const createVaultKeys = (
  vaultClient: VaultClient,
  vaultKeys: string[],
) => {
  return Promise.all(
    vaultKeys.map((vaultKey) => vaultClient.createKey(vaultKey)),
  );
};

/**
 * Create tezos account corresponding to the vault key and reveal the account
 * Step 1: Activate account by sending some tz from a given account to the address which is built by vault key
 * Step 2: Reveal account by using the account just created and send back to a given tezos account some tz
 *
 * @param {object} tezosService      - the service to interact with tezos
 * @param {object} signer    - the signer corresponding to the given tezos account
 * @param {string[]} vaultKeys       - the list of vault keys that need to have a tezos account
 *
 * @return {Promise<void>}
 *
 * The reason why the function is declared as an expression is to be able to mock it in unit tests
 * otherwise it is not possible to skip the blockchain call.
 * reference: https://github.com/facebook/jest/issues/936#issuecomment-545080082
 */
export const createTezosAccountsByVaultKeys = async (
  tezosService: TezosService,
  signer: Signer,
  vaultKeys: string[],
) => {
  const activatorAccountPKH = await signer.publicKeyHash();

  for (const vaultKey of vaultKeys) {
    tezosService.setSigner(signer);
    const vaultSigner = new VaultSigner(vaultClientConfig, vaultKey, logger);

    const pkh = await vaultSigner.publicKeyHash();

    logger.info({ pkh }, 'Going to activate this account');

    // This step is to activate the account
    // The operation is included by Taquito automatically to the transaction when the transfer recipient account is not yet activated
    const transactionOperation = await tezosService.tezos.contract.transfer({
      to: pkh,
      amount: transferAmount,
    });

    logger.info({ hash: transactionOperation.hash }, 'ACTIVATE ACCOUNT');

    // Wait for the transaction to be confirmed
    await transactionOperation.confirmation(1);

    tezosService.setSigner(vaultSigner);

    // This step is to reveal the account
    // The operation is included by Taquito automatically to the transaction when the sender account is not yet revealed
    const { hash: operationHash } = await tezosService.tezos.contract.transfer({
      to: activatorAccountPKH,
      amount: 1,
    });
    logger.info({ operationHash }, 'REVEAL ACCOUNT');
  }
};
