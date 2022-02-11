import { logger } from '../../services/logger';
import sodium from 'libsodium-wrappers';
import { b58cdecode, hex2buf, mergebuf, prefix } from '@taquito/utils';

/**
 * @description    - Signs an operation with a vault key
 * @return  {Object}
 */
export async function checkEd25519Signature(
  signature: string, // TODO can be validated by validateSignature from '@taquito/utils'
  publicKey: string,
  signedPayload: string,
  operationPrefix?: boolean,
): Promise<boolean> {
  try {
    logger.info(
      {
        signature,
        publicKey,
        signedPayload,
        operationPrefix,
      },
      'The sign value',
    );

    const bytes = operationPrefix
      ? mergebuf(new Uint8Array([3]), hex2buf(signedPayload))
      : hex2buf(signedPayload);

    return sodium.crypto_sign_verify_detached(
      b58cdecode(signature, prefix.edsig),
      sodium.crypto_generichash(32, bytes),
      b58cdecode(publicKey, prefix.edpk),
    );
  } catch (err) {
    logger.error(
      { error: err },
      '[lib/test/signWithInMemorySigner] Unexpected error happened',
    );

    throw err;
  }
}
