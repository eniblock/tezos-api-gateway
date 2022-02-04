import toBuffer from 'typedarray-to-buffer';
import sodium from 'libsodium-wrappers';
import Logger from 'bunyan';
import { b58cencode, buf2hex, hex2buf, mergebuf, prefix } from '@taquito/utils';
import { Signer } from '@taquito/taquito';

import { VaultClient, VaultClientConfig } from '../clients/vault-client';
import { UndefinedPublicKeyError } from '../../const/errors/undefined-public-key-error';
import { UndefinedSignatureError } from '../../const/errors/undefined-signature-error';

export class VaultSigner implements Signer {
  private _vaultClient: VaultClient;
  private _logger: Logger;
  private _keyName: string;

  constructor(config: VaultClientConfig, keyName: string, logger: Logger) {
    this._vaultClient = new VaultClient(config, logger);
    this._logger = logger;
    this._keyName = keyName;
  }

  public get vaultClient() {
    return this._vaultClient;
  }

  public get logger() {
    return this._logger;
  }

  /**
   * Get the public key from the vault client then return the buffer
   *
   * @return {Buffer} the buffer of the public string
   */
  private async getPublicKeyBuffer(): Promise<Buffer> {
    this.logger.info('[VaultSigner] Retrieving public key buffer');
    const publicKey = await this.vaultClient.getPublicKey(this._keyName);

    if (!publicKey) {
      throw new UndefinedPublicKeyError(this._keyName);
    }

    return Buffer.from(publicKey, 'base64');
  }

  /**
   * Get the public key from the vault client
   * Convert to Tezos format by adding the prefix and encode base 58
   */
  async publicKey(): Promise<string> {
    const publicKey = b58cencode(await this.getPublicKeyBuffer(), prefix.edpk);

    this.logger.info(
      { publicKey },
      '[VaultSigner/publicKey] Retrieved public key',
    );
    return publicKey;
  }

  /**
   * Get the public key from the vault client then return public key hash
   */
  async publicKeyHash(): Promise<string> {
    await sodium.ready;

    const bufferPublicKey = await this.getPublicKeyBuffer();

    const pkh = b58cencode(
      sodium.crypto_generichash(20, new Uint8Array(bufferPublicKey)),
      prefix.tz1,
    );

    this.logger.info(
      { publicKeyHash: pkh },
      '[VaultSigner/publicKeyHash] Retrieved public key hash',
    );
    return pkh;
  }

  /**
   * Since we use vault, we don't reveal the secretKey
   * This function help to respect the Signer class of Taquito
   */
  secretKey(): Promise<string | undefined> {
    return Promise.resolve().then();
  }

  /**
   * Call the vault client to sign the forged operation
   *
   * @param {string} forgedOperation    - the forged operation to sign
   * @param {Unit8Array} magicByte      - the byte to add to forged operation
   *
   * @return {object} the Taquito format of signed object
   */
  async sign(
    forgedOperation: string,
    magicByte?: Uint8Array,
  ): Promise<{
    bytes: string;
    sig: string;
    prefixSig: string;
    sbytes: string;
  }> {
    await sodium.ready;

    const hex = hex2buf(forgedOperation);

    const mergeBuf = magicByte ? mergebuf(magicByte, hex) : hex;

    const bytesHash = toBuffer(
      sodium.crypto_generichash(32, mergeBuf),
    ).toString('base64');

    this.logger.info(
      { forgedHash: bytesHash },
      '[VaultSigner/sign] Request to sign with this forged bytes hash',
    );
    const signature = await this.vaultClient.sign(bytesHash, this._keyName);

    if (!signature) {
      throw new UndefinedSignatureError(this._keyName, forgedOperation);
    }

    this.logger.info(
      { forgedOperation },
      '[VaultSigner/sign] Successfully signed forged operation',
    );
    const buffer = Buffer.from(signature, 'base64');

    const encodedPrefixSignature = b58cencode(buffer, prefix.edsig);
    const encodedSignature = b58cencode(buffer, prefix.sig);

    return {
      bytes: forgedOperation,
      sig: encodedSignature,
      prefixSig: encodedPrefixSignature,
      sbytes: forgedOperation + buf2hex(buffer),
    };
  }
}
