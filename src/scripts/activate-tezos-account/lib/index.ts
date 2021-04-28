import Logger from 'bunyan';

import { VaultClient } from '../../../services/clients/vault-client';
import { transferAmount } from '../config';
import { VaultSigner } from '../../../services/signers/vault';
import { vaultClientConfig } from '../../../config';
import { TezosService } from '../../../services/tezos';
import { InMemorySigner } from '@taquito/signer';

/**
 * Create and store the keys in vault
 *
 * @param {object} vaultClient - the vault client to create keys
 * @param {string[]} vaultKeys - the list of vault keys going to be created
 *
 * @return {Promise<void>}
 */
export function createVaultKeys(vaultClient: VaultClient, vaultKeys: string[]) {
  return Promise.all(
    vaultKeys.map((vaultKey) => vaultClient.createKey(vaultKey)),
  );
}

/**
 * Create tezos account corresponding to the vault key and reveal the account
 * Step 1: Activate account by sending some tz from a given account to the address which is built by vault key
 * Step 2: Reveal account by using the account just created and send back to a given tezos account some tz
 *
 * @param {object} tezosService      - the service to interact with tezos
 * @param {object} inMemorySigner    - the signer corresponding to the given tezos account
 * @param {string[]} vaultKeys       - the list of vault keys that need to have a tezos account
 * @param {object} logger            - logger
 *
 * @return {Promise<void>}
 */
export async function createTezosAccountsByVaultKeys(
  tezosService: TezosService,
  inMemorySigner: InMemorySigner,
  vaultKeys: string[],
  logger: Logger,
) {
  const faucetAccountPKH = await inMemorySigner.publicKeyHash();

  for (const vaultKey of vaultKeys) {
    tezosService.setSigner(inMemorySigner);
    const vaultSigner = new VaultSigner(vaultClientConfig, vaultKey, logger);

    const pkh = await vaultSigner.publicKeyHash();

    logger.info({ pkh }, 'Going to activate this account');

    // This step is to activate the account
    const transactionOperation = await tezosService.tezos.contract.transfer({
      to: pkh,
      amount: transferAmount,
    });

    logger.info({ hash: transactionOperation.hash }, 'ACTIVATE ACCOUNT');

    // Wait for the transaction to be confirmed
    await transactionOperation.confirmation(2);

    tezosService.setSigner(vaultSigner);

    // This step is to reveal the account
    const { hash: operationHash } = await tezosService.tezos.contract.transfer({
      to: faucetAccountPKH,
      amount: 1,
    });
    logger.info({ operationHash }, 'REVEAL ACCOUNT');
  }
}
