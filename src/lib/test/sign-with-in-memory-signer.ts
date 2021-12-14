import { logger } from '../../services/logger';
import { InMemorySigner } from '@taquito/signer';
import { InMemorySignerResult } from '../../const/interfaces/test/sign-with-in-memory-signer';

/**
 * @description    - Signs an operation with taquito's inMemorySigner
 * @return  {Object}
 */
export async function signWithInMemorySigner(
  privateKey: string,
  forgedOperation: string,
): Promise<InMemorySignerResult> {
  try {
    const inMemorySigner = new InMemorySigner(privateKey);

    const { sbytes, prefixSig } = await inMemorySigner.sign(
      forgedOperation,
      new Uint8Array([3]),
    );

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
