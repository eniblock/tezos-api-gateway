import nock from 'nock';
import {
  tezosNodeUrl,
  tezosPrivateKey,
  vaultClientConfig as vaultTestConfig,
} from '../../../__fixtures__/config';
import { logger } from '../../../__fixtures__/services/logger';
import { TezosService } from '../../../../src/services/tezos';
import * as userLib from '../../../../src/lib/user/create-account';
import { VaultClient } from '../../../../src/services/clients/vault-client';
import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';

describe('[lib/user-create-account] create Tezos accounts', () => {
  const tezosService = new TezosService(tezosNodeUrl);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#createAccounts', () => {
    afterEach(() => {
      nock.cleanAll();
    });

    it('should correctly create accounts and return the corresponding addresses', async () => {
      const vaultNock1 = nock('http://localhost:8300')
        .get(`/v1/transit/keys/key1`)
        .reply(200, {
          request_id: '4e171bc2-6df7-7dab-b10b-d100efca7080',
          lease_id: '',
          lease_duration: 0,
          renewable: false,
          data: {
            allow_plaintext_backup: false,
            deletion_allowed: false,
            derived: false,
            exportable: true,
            keys: {
              '1': {
                creation_time: '2021-02-01T10:01:29.097094+01:00',
                name: 'ed25519',
                public_key: 'ajwQQUHP/JZ74hoG3UoF+k/9EJPi33/ynxCxubcwYWM=',
              },
            },
            latest_version: 1,
            min_available_version: 0,
            min_decryption_version: 1,
            min_encryption_version: 0,
            name: 'key1',
            supports_decryption: false,
            supports_derivation: true,
            supports_encryption: false,
            supports_signing: true,
            type: 'ed25519',
          },
          warnings: null,
        });
      const vaultNock2 = nock('http://localhost:8300')
        .get(`/v1/transit/keys/key2`)
        .reply(200, {
          request_id: 'e23cae93-c44d-a812-64a4-9ff10b94b5ce',
          lease_id: '',
          lease_duration: 0,
          renewable: false,
          data: {
            allow_plaintext_backup: false,
            deletion_allowed: false,
            derived: false,
            exportable: true,
            keys: {
              '1': {
                creation_time: '2021-02-01T10:01:29.097094+01:00',
                name: 'ed25519',
                public_key: 'jyyitbZRY3kxwCk4+kzfOB6rHYnxBxmLdkAqY3hxArc=',
              },
            },
            latest_version: 1,
            min_available_version: 0,
            min_decryption_version: 1,
            min_encryption_version: 0,
            name: 'key2',
            supports_decryption: false,
            supports_derivation: true,
            supports_encryption: false,
            supports_signing: true,
            type: 'ed25519',
          },
          warnings: null,
        });

      jest.spyOn(userLib, 'activateAndRevealAccounts').mockImplementation();

      const createKeysSpy = jest
        .spyOn(userLib, 'createVaultKeys')
        .mockImplementation();

      const saveIdByAddressSpy = jest
        .spyOn(userLib, 'saveUserIdByAddresses')
        .mockImplementation();

      const accounts = await userLib.createAccounts(['key1', 'key2']);

      vaultNock1.done();
      vaultNock2.done();

      expect(accounts[0].userId).toEqual('key1');
      expect(accounts[0].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      expect(accounts[1].userId).toEqual('key2');
      expect(accounts[1].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      expect(createKeysSpy).toHaveBeenCalledTimes(1);
      expect(saveIdByAddressSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('#createVaultKeys', () => {
    const vaultClient = new VaultClient(vaultTestConfig, logger);

    it('should correctly call the vault client to create the keys', async () => {
      const createKeysSpy = jest
        .spyOn(vaultClient, 'createKey')
        .mockImplementation();

      await userLib.createVaultKeys(vaultClient, ['key1', 'key2', 'key3']);

      expect(createKeysSpy).toHaveBeenCalledTimes(3);
      expect(createKeysSpy).toHaveBeenCalledWith('key1');
      expect(createKeysSpy).toHaveBeenCalledWith('key2');
      expect(createKeysSpy).toHaveBeenCalledWith('key3');
    });
  });

  describe('#createTezosAccountsByVaultKeys', () => {
    const inMemorySigner = new InMemorySigner(tezosPrivateKey);
    const transferFn = jest.fn();
    const checkConfirmFn = jest.fn();

    const fakeTezos = {
      contract: {
        transfer: transferFn,
      },
    };
    const fakeTransferOperation = {
      confirmation: checkConfirmFn,
    };

    it('should correctly call the functions to activate and reveal account', async () => {
      transferFn.mockResolvedValue(fakeTransferOperation);
      const publickKeyHashSpy = jest
        .spyOn(inMemorySigner, 'publicKeyHash')
        .mockResolvedValue('publicKeyHash');
      const tezosSpy = jest
        .spyOn(tezosService, 'tezos', 'get')
        .mockReturnValue(fakeTezos as unknown as TezosToolkit);

      const vaultNock1 = nock('http://localhost:8300')
        .get(`/v1/transit/keys/key1`)
        .reply(200, {
          request_id: '4e171bc2-6df7-7dab-b10b-d100efca7080',
          lease_id: '',
          lease_duration: 0,
          renewable: false,
          data: {
            allow_plaintext_backup: false,
            deletion_allowed: false,
            derived: false,
            exportable: true,
            keys: {
              '1': {
                creation_time: '2021-02-01T10:01:29.097094+01:00',
                name: 'ed25519',
                public_key: 'ajwQQUHP/JZ74hoG3UoF+k/9EJPi33/ynxCxubcwYWM=',
              },
            },
            latest_version: 1,
            min_available_version: 0,
            min_decryption_version: 1,
            min_encryption_version: 0,
            name: 'key1',
            supports_decryption: false,
            supports_derivation: true,
            supports_encryption: false,
            supports_signing: true,
            type: 'ed25519',
          },
          warnings: null,
        });
      const vaultNock2 = nock('http://localhost:8300')
        .get(`/v1/transit/keys/key2`)
        .reply(200, {
          request_id: 'e23cae93-c44d-a812-64a4-9ff10b94b5ce',
          lease_id: '',
          lease_duration: 0,
          renewable: false,
          data: {
            allow_plaintext_backup: false,
            deletion_allowed: false,
            derived: false,
            exportable: true,
            keys: {
              '1': {
                creation_time: '2021-02-01T10:01:29.097094+01:00',
                name: 'ed25519',
                public_key: 'jyyitbZRY3kxwCk4+kzfOB6rHYnxBxmLdkAqY3hxArc=',
              },
            },
            latest_version: 1,
            min_available_version: 0,
            min_decryption_version: 1,
            min_encryption_version: 0,
            name: 'key2',
            supports_decryption: false,
            supports_derivation: true,
            supports_encryption: false,
            supports_signing: true,
            type: 'ed25519',
          },
          warnings: null,
        });

      await userLib.activateAndRevealAccounts(tezosService, inMemorySigner, {
        userIdList: ['key1', 'key2'],
        secureKeyName: 'test',
      });

      vaultNock1.done();
      vaultNock2.done();

      expect(publickKeyHashSpy).toHaveBeenCalledTimes(1);
      expect(tezosSpy).toHaveBeenCalledTimes(4);
      expect(transferFn.mock.calls).toEqual([
        [
          {
            to: 'tz1UCubRycjt5kqkdBPDvmSSxHG1oZ8AX2Cu',
            amount: 2,
          },
        ],
        [
          {
            to: 'publicKeyHash',
            amount: 1,
          },
        ],
        [
          {
            to: 'tz1YCmopN9D4WgkTvnqkGExwAHSHokvApXJG',
            amount: 2,
          },
        ],
        [
          {
            to: 'publicKeyHash',
            amount: 1,
          },
        ],
      ]);
      expect(checkConfirmFn.mock.calls).toEqual([[1], [1]]);
    });
  });
});
