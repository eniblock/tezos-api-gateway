import nock from 'nock';
import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';

import { VaultClient } from '../../../../../src/services/clients/vault-client';
import { vaultClientConfig } from '../../../../../src/config';
import {
  tezosNodeEdonetUrl,
  vaultClientConfig as vaultTestConfig,
} from '../../../../__fixtures__/config';
import { logger } from '../../../../__fixtures__/services/logger';
import {
  createTezosAccountsByVaultKeys,
  createVaultKeys,
} from '../../../../../src/scripts/activate-tezos-account/lib';
import { tezosPrivateKey } from '../../../../../src/scripts/activate-tezos-account/config';
import { TezosService } from '../../../../../src/services/tezos';
import { VaultSigner } from '../../../../../src/services/signers/vault';
import {
  testAccount10,
  testAccount9,
} from '../../../../__fixtures__/smart-contract';

describe('[scripts/activate-tezos-account/lib/index.ts]', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('#createVaultKeys', () => {
    const vaultClient = new VaultClient(vaultTestConfig, logger);

    it('should correctly call the vault client to create the keys', async () => {
      const createKeysSpy = jest
        .spyOn(vaultClient, 'createKey')
        .mockImplementation();

      await createVaultKeys(vaultClient, ['key1', 'key2', 'key3']);

      expect(createKeysSpy).toHaveBeenCalledTimes(3);
      expect(createKeysSpy).toHaveBeenCalledWith('key1');
      expect(createKeysSpy).toHaveBeenCalledWith('key2');
      expect(createKeysSpy).toHaveBeenCalledWith('key3');
    });
  });

  describe('#createTezosAccountsByVaultKeys', () => {
    const inMemorySigner = new InMemorySigner(tezosPrivateKey);
    const tezosService = new TezosService(tezosNodeEdonetUrl);
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
        .mockReturnValue((fakeTezos as unknown) as TezosToolkit);
      const setSignerSpy = jest
        .spyOn(tezosService, 'setSigner')
        .mockImplementation();

      const vaultSigner1 = new VaultSigner(vaultClientConfig, 'key1', logger);
      const vaultSigner2 = new VaultSigner(vaultClientConfig, 'key2', logger);

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

      await createTezosAccountsByVaultKeys(
        tezosService,
        inMemorySigner,
        ['key1', 'key2'],
        logger,
      );

      vaultNock1.done();
      vaultNock2.done();

      expect(publickKeyHashSpy).toHaveBeenCalledTimes(1);
      expect(tezosSpy).toHaveBeenCalledTimes(4);
      expect(setSignerSpy.mock.calls).toEqual([
        [inMemorySigner],
        [vaultSigner1],
        [inMemorySigner],
        [vaultSigner2],
      ]);
      expect(transferFn.mock.calls).toEqual([
        [
          {
            to: testAccount9,
            amount: 100,
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
            to: testAccount10,
            amount: 100,
          },
        ],
        [
          {
            to: 'publicKeyHash',
            amount: 1,
          },
        ],
      ]);
      expect(checkConfirmFn.mock.calls).toEqual([[2], [2]]);
    });
  });
});
