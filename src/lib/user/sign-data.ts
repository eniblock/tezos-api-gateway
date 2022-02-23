import { logger } from '../../services/logger';
import { VaultSigner } from '../../services/signers/vault';
import { vaultClientConfig } from '../../config';
import { SignDataResult } from '../../const/interfaces/user/sign/sign-data';

/**
 * @description    - Signs data with a vault key
 * @return  {Object}
 */
export async function signData(
  userId: string,
  bytesToSign: string,
  operationPrefix?: boolean,
): Promise<SignDataResult> {
  try {
    const vaultSigner = new VaultSigner(vaultClientConfig, userId, logger);
    logger.info(
      { userId, bytesToSign, operationPrefix },
      '[lib/user/signData] Signing data with user"s vault wallet',
    );

    const { sbytes, prefixSig } =
      operationPrefix !== undefined && operationPrefix
        ? await vaultSigner.sign(bytesToSign, new Uint8Array([3]))
        : await vaultSigner.sign(bytesToSign);

    logger.info(
      { signedData: sbytes, signature: prefixSig },
      '[lib/user/signData] Signing data with user"s vault wallet',
    );
    return { signedData: sbytes, signature: prefixSig };
  } catch (err) {
    logger.error(
      { error: err },
      '[lib/user/signData] Unexpected error happened',
    );

    throw err;
  }
}
