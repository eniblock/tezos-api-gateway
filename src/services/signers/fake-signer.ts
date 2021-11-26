/* istanbul ignore file */
import { Signer } from '@taquito/taquito';

/* This signer class is only used for forge process to estimate the gas limit and fee
 * This is only meant to get the the public key hash (which will be passed in the constructor)
 * This class DOES NOT PERFORM ANY SIGNING ACTION
 */
export class FakeSigner implements Signer {
  private readonly _pkh: string;
  private readonly _publicKey: string;

  constructor(pkh: string, publicKey: string) {
    this._pkh = pkh;
    this._publicKey = publicKey;
  }

  publicKey(): Promise<string> {
    return Promise.resolve(this._publicKey);
  }

  publicKeyHash(): Promise<string> {
    return Promise.resolve(this._pkh);
  }

  secretKey(): Promise<string | undefined> {
    return Promise.resolve(undefined);
  }

  sign(
    _op: {},
    _magicByte?: Uint8Array,
  ): Promise<{
    bytes: string;
    sig: string;
    prefixSig: string;
    sbytes: string;
  }> {
    return Promise.resolve({ bytes: '', prefixSig: '', sbytes: '', sig: '' });
  }
}
