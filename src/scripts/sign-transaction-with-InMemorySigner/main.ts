import { InMemorySigner } from '@taquito/signer';

import { forgeOperation, tezosPrivateKey } from './config';
import { createLogger } from '../../services/logger';

async function start() {
  const logger = createLogger({
    name: 'Sign Transaction With In Memory',
    level: 'info',
  });

  const inMemorySigner = new InMemorySigner(tezosPrivateKey);

  const { sbytes, prefixSig } = await inMemorySigner.sign(
    forgeOperation,
    new Uint8Array([3]),
  );

  logger.info(
    { signedOperation: sbytes, signature: prefixSig },
    'The sign value',
  );
}

if (!module.parent) {
  start();
}
