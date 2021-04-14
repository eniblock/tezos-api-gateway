import { InMemorySigner } from '@taquito/signer';

import { tezosNodeUrls, vaultClientConfig } from '../../config';
import { tezosPrivateKey, vaultKeys } from './config';
import { createTezosAccountsByVaultKeys, createVaultKeys } from './lib';
import { VaultClient } from '../../services/clients/vault-client';
import { createLogger } from '../../services/logger';
import { GatewayPool } from '../../services/gateway-pool';

async function start() {
  const logger = createLogger({
    name: 'Activate Tezos Account',
    level: 'info',
  });
  const gatewayPool = new GatewayPool(tezosNodeUrls, logger);
  const tezosService = await gatewayPool.getTezosService();
  const inMemorySigner = new InMemorySigner(tezosPrivateKey);
  const vaultClient = new VaultClient(vaultClientConfig, logger);

  await createVaultKeys(vaultClient, vaultKeys);

  await createTezosAccountsByVaultKeys(
    tezosService,
    inMemorySigner,
    vaultKeys,
    logger,
  );
}

if (!module.parent) {
  start();
}
