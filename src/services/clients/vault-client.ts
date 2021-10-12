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
   * @param {string} keyNameOfSecret      - key name of the secret
   *
   * @return {string} return the stored secret
   */
  public async getSecret(
    path: string,
    key: string,
    keyNameOfSecret: string,
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

      return result.data!.data![keyNameOfSecret];
    } catch (err) {
      this.handleError(err, { keyName: key });

      if (err.status === 404) {
        throw new ClientError({
          status: err.status,
          message: `Not found : secret ${key} doesn't exist in Vault`,
        });
      } else if (err.status >= 400 && err.status < 500) {
        throw new ClientError({
          status: err.status,
          message: err.message,
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

  /**
   * Call the the vault service to set a secret
   *
   * @param {string} path      - the where the secret will be stored
   * @param {string} ref       - the reference
   * @param {string} key       - the key for the secret
   * @param {string} value     - the value of the key
   *
   * @return {Promise<void>}
   */
  public async setSecret(
    path: string,
    ref: string,
    key: string,
    value: string,
  ): Promise<void> {
    const createKeyUrl = url.resolve(
      this.baseUrl,
      `secret/data/${path}/${ref}`,
    );

    try {
      const { body: result } = await superagent
        .post(createKeyUrl)
        .set({ 'X-Vault-Token': this._token })
        .send({
          data: {
            [key]: value,
          },
        });

      this.logger.info(
        { resultData: result.data },
        '[VaultClient] data received',
      );
    } catch (err) {
      this.handleError(err, { keyName: ref });

      if (err.status >= 400 && err.status < 500) {
        throw new ClientError({
          status: err.status,
          message: JSON.stringify(err.response?.body),
        });
      }
    }
  }

  /**
   * @description              - fetch a list of keys from a {path} of KV Secrets Engine v2
   * @param {string} path
   * @return {string[]}        - a list of secret keys
   */
  public async getSecretMetadataList(path: string): Promise<string[]> {
    const getSecretMetadataListUrl = url.resolve(
      this.baseUrl,
      `secret/metadata/${path}`,
    );

    try {
      const { body: result } = await superagent(
        'LIST',
        getSecretMetadataListUrl,
      ).set({ 'X-Vault-Token': this._token });

      this.logger.info(
        { resultData: result.data },
        '[VaultClient] data received',
      );
      return result.data!.keys!;
    } catch (err) {
      this.handleError(err, { path });

      if (err.status >= 400 && err.status < 500) {
        throw new ClientError({
          status: err.status,
          message: JSON.stringify(err.response?.body),
        });
      }
      throw err;
    }
  }

  /**
   * @description         - returns a list of keys. Only the key names are returned (not the actual keys themselves).
   * @return {string[]}
   */
  public async getAllTransitNames() {
    const getAllTransitNamesList = url.resolve(this.baseUrl, 'transit/keys');

    try {
      const { body: result } = await superagent(
        'LIST',
        getAllTransitNamesList,
      ).set({ 'X-Vault-Token': this._token });

      this.logger.info(
        { resultData: result.data },
        '[VaultClient] data received',
      );
      return result.data!.keys!;
    } catch (err) {
      this.handleError(err, { path: 'transit/keys' });

      if (err.status >= 400 && err.status < 500) {
        throw new ClientError({
          status: err.status,
          message: JSON.stringify(err.response?.body),
        });
      }
      throw err;
    }
  }

  /**
   * Get a key stored in /transit by its name
   *
   * @param {string} keyName  - key name
   *
   * @return {object}         - the key object
   */
  public async getTransitByName(keyName: string) {
    const getTransitByName = url.resolve(
      this.baseUrl,
      `transit/keys/${keyName}`,
    );

    try {
      const { body: result } = await superagent.get(getTransitByName).set({
        'X-Vault-Token': this._token,
      });

      this.logger.info(
        { resultData: result.data },
        '[VaultClient] data received',
      );
      return result.data;
    } catch (err) {
      this.handleError(err, { path: 'transit/:keyName', keyName });
      if (err.status === 404) {
        throw new ClientError({
          status: err.status,
          message: `Not found : ${keyName} doesn't exist in Vault`,
        });
      } else if (err.status >= 400 && err.status < 500) {
        throw new ClientError({
          status: err.status,
          message: JSON.stringify(err.response?.body),
        });
      }
      throw err;
    }
  }

  /**
   * @description  - rotates the version of the named key. After rotation, new plaintext requests will be encrypted with the new version of the key.
   * @param name
   */
  async rotateKeys(name: string) {
    const rotateKeysUrl = url.resolve(
      this.baseUrl,
      `transit/keys/${name}/rotate`,
    );

    try {
      await superagent
        .post(rotateKeysUrl)
        .set({ 'X-Vault-Token': this._token });
    } catch (err) {
      this.handleError(err, { keyName: name });

      if (err.status >= 400 && err.status < 500) {
        throw new ClientError({
          status: err.status,
          message: JSON.stringify(err.response?.body),
        });
      }
    }
  }

  /**
   * Call the the vault service to permanently delete a secret
   *
   * @param {string} path      - the where the secret will be stored
   * @param {string} ref       - the reference
   *
   * @return {Promise<void>}
   */
  public async deleteSecret(path: string, ref: string): Promise<void> {
    const createKeyUrl = url.resolve(
      this.baseUrl,
      `secret/metadata/${path}/${ref}`,
    );

    try {
      const { body: result } = await superagent
        .delete(createKeyUrl)
        .set({ 'X-Vault-Token': this._token })
        .send();

      this.logger.info(
        { resultData: result.data },
        '[VaultClient] Operation done',
      );
    } catch (err) {
      this.handleError(err, { keyName: ref });

      if (err.status >= 400 && err.status < 500) {
        throw new ClientError({
          status: err.status,
          message: JSON.stringify(err.response?.body),
        });
      }
    }
  }
}
