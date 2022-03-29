import { logger } from '../../services/logger';
import sodium from 'libsodium-wrappers';
import { b58cdecode, hex2buf, mergebuf, prefix } from '@taquito/utils';

/**
 * @description    - Check a signature validity
 * @return  {Object}
 */
export async function checkTezosSignature(
  signature: string,
  publicKey: string,
  hexData: string,
  operationPrefix?: boolean,
): Promise<boolean> {
  try {
    logger.info(
      {
        signature,
        publicKey,
        hexData,
        operationPrefix,
      },
      '[lib/utils/checkTezosSignature] Checking Tezos signature',
    );

    const bytes = operationPrefix
      ? mergebuf(new Uint8Array([3]), hex2buf(hexData))
      : hex2buf(hexData);

    await sodium.ready;

    return sodium.crypto_sign_verify_detached(
      b58cdecode(signature, prefix.edsig),
      sodium.crypto_generichash(32, bytes),
      b58cdecode(publicKey, prefix.edpk),
    );
  } catch (err) {
    logger.error(
      { error: err },
      '[lib/utils/checkTezosSignature] Unexpected error happened',
    );

    throw err;
  }
}
