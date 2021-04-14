/* istanbul ignore file */
import { Signer } from '@taquito/taquito';

/* This signer class is only used for forge process to estimate the gas limit and fee
 * This is only meant to get the the public key hash (which will be passed in the constructor)
 * This class DOES NOT PERFORM ANY SIGNING ACTION
 */
export class FakeSigner implements Signer {
  private pkh: string;

  constructor(pkh: string) {
    this.pkh = pkh;
  }

  publicKey(): Promise<string> {
    return Promise.resolve('');
  }

  publicKeyHash(): Promise<string> {
    return Promise.resolve(this.pkh);
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
