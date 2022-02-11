import { logger } from '../../services/logger';
import { InMemorySignerResult } from '../../const/interfaces/test/sign-with-in-memory-signer';
import { VaultSigner } from '../../services/signers/vault';
import { vaultClientConfig } from '../../config';

/**
 * @description    - Signs an operation with a vault key
 * @return  {Object}
 */
export async function signWithVaultKey(
  secureKeyName: string,
  forgedOperation: string,
  operationPrefix?: boolean,
): Promise<InMemorySignerResult> {
  try {
    const vaultSigner = new VaultSigner(
      vaultClientConfig,
      secureKeyName,
      logger,
    );

    const { sbytes, prefixSig } =
      operationPrefix !== undefined && operationPrefix
        ? await vaultSigner.sign(forgedOperation, new Uint8Array([3]))
        : await vaultSigner.sign(forgedOperation);

    logger.info(
      { signedOperation: sbytes, signature: prefixSig },
      'The sign value',
    );
    return { signedOperation: sbytes, signature: prefixSig };
  } catch (err) {
    logger.error(
      { error: err },
      '[lib/test/signWithInMemorySigner] Unexpected error happened',
    );

    throw err;
  }
}
