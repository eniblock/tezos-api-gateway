import { Signer } from '@taquito/taquito';
import { VaultClientConfig } from './clients/vault-client';
import Logger from 'bunyan';

type VaultSignerParam<T> = new (
  config: VaultClientConfig,
  keyName: string,
  logger: Logger,
) => T;
type FakeSignerParam<T> = new (pkh: string) => T;

type GenerateSignerParamType<T> = VaultSignerParam<T> | FakeSignerParam<T>;

export class SignerFactory {
  private _signer?: Signer;

  constructor(signer?: Signer) {
    this._signer = signer;
  }

  public get signer(): Signer | undefined {
    return this._signer;
  }

  public set signer(signer: Signer | undefined) {
    this._signer = signer;
  }

  /**
   *
   * @param type    - The type of a class which inherit of Signer interface from Taquito lib
   * @param args    - All the arguments needed to instanciate {type}
   *
   * @return {type}    - {type} instanciated
   */
  public generateSigner<T>(
    type: GenerateSignerParamType<T>,
    ...args: any[]
  ): T {
    // @ts-ignore
    this._signer = new type(...args);
    return this._signer as unknown as T;
  }
}
