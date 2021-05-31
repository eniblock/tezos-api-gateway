import url from 'url';
import superagent from 'superagent';
import Logger from 'bunyan';

import { AbstractClient } from './abstract-client';
import { VaultKey } from '../../const/interfaces/vault-key';
import { ClientError } from '../../const/errors/client-error';

const ED25519 = 'ed25519';

export interface VaultClientConfig {
  apiUrl: string;
  token: string;
}

export class VaultClient extends AbstractClient {
  private _token;

  constructor({ token, apiUrl }: VaultClientConfig, logger: Logger) {
    super({ apiUrl }, logger);
    this._token = token;
  }

  /**
   * Call the the vault service to create an ed25519 key
   *
   * @param {string} key  - the name
   *
   * @return {Promise<void>}
   */
  public async createKey(key: string): Promise<void> {
    const createKeyUrl = url.resolve(this.baseUrl, `transit/keys/${key}`);

    try {
      await superagent
        .post(createKeyUrl)
        .set({ 'X-Vault-Token': this._token })
        .send({
          type: ED25519,
        });
    } catch (err) {
      this.handleError(err, { keyName: key });

      if (err.status >= 400 && err.status < 500) {
        throw new ClientError({
          status: err.status,
          message: JSON.stringify(err.response?.body),
        });
      }
    }
  }

  /**
   * Call the the vault service to save a secret
   *
   * @param {string} path                 - data location path
   * @param {string} key                  - the secret data key
   * @param {string} value                - the secret data value
   *
   * @return {Promise<void>}
   */
  public async saveSecret(
    path: string,
    key: string,
    value: string,
  ): Promise<void> {
    const saveSecretUrl = url.resolve(
      this.baseUrl,
      `secret/data/${path}/${key}`,
    );

    try {
      await superagent
        .post(saveSecretUrl)
        .set({ 'X-Vault-Token': this._token })
        .send({
          data: {
            userId: value,
          },
        });
    } catch (err) {
      this.handleError(err, { keyName: key });

      if (err.status >= 400 && err.status < 500) {
        throw new ClientError({
          status: err.status,
          message: JSON.stringify(err.response?.body),
        });
      }
    }
  }

  /**
   * Call the the vault service to sign the forged operation has
   *
   * @param {string} forgedOperationHash  - the forged operation hash
   * @param {string} key                  - the key that is used to sign
   *
   * @return {string} the signature after signing the operation
   */
  public async sign(
    forgedOperationHash: string,
    key: string,
  ): Promise<string | undefined> {
    const signUrl = url.resolve(this.baseUrl, `transit/sign/${key}`);

    try {
      const { body: result } = await superagent
        .post(signUrl)
        .set({ 'X-Vault-Token': this._token })
        .send({
          input: forgedOperationHash,
        });

      const {
        data: { signature },
      } = result;

      return (signature as string).substring(9);
    } catch (err) {
      this.handleError(err, { keyName: key, forgedOperationHash });
    }

    return;
  }

  /**
   * Get the stored secret the vault service
   *
   * @param {string} path                 - data location path
   * @param {string} key                  - the secret data key
   *
   * @return {string} return the stored secret
   */
  public async getSecret(
    path: string,
    key: string,
  ): Promise<string | undefined> {
    const getSecretUrl = url.resolve(
      this.baseUrl,
      `secret/data/${path}/${key}`,
    );

    try {
      const { body: result } = await superagent
        .get(getSecretUrl)
        .set({ 'X-Vault-Token': this._token });

      this.logger.info(
        { result, key },
        '[VaultClient] Retrieve secret from vault',
      );

      return result.data!.data!.userId;
    } catch (err) {
      this.handleError(err, { keyName: key });

      if (err.status >= 400 && err.status < 500) {
        throw new ClientError({
          status: err.status,
          message: JSON.stringify(err.response?.body),
        });
      }
    }

    return;
  }

  /**
   * Get the public key from the vault service
   *
   * @param {string} key                  - the name of the key
   *
   * @return {string} return the public key
   */
  public async getPublicKey(key: string): Promise<string | undefined> {
    const getPublicKeyUrl = url.resolve(this.baseUrl, `transit/keys/${key}`);

    try {
      const { body: result } = await superagent
        .get(getPublicKeyUrl)
        .set({ 'X-Vault-Token': this._token });

      this.logger.info(
        { result, key },
        '[VaultClient] Retrieve this public key from vault',
      );

      const {
        data: { keys },
      } = result;

      const values = Object.values(keys);

      const { public_key: publicKey } = values[values.length - 1] as VaultKey;

      return publicKey;
    } catch (err) {
      this.handleError(err, { keyName: key });

      if (err.status >= 400 && err.status < 500) {
        throw new ClientError({
          status: err.status,
          message: JSON.stringify(err.response?.body),
        });
      }
    }

    return;
  }
}
