import nock from 'nock';

import { vaultClientConfig } from '../../../__fixtures__/config';
import { logger } from '../../../__fixtures__/services/logger';

import { VaultClient } from '../../../../src/services/clients/vault-client';
import { ClientError } from '../../../../src/const/errors/client-error';

describe('[services/clients] VaultClient Client', () => {
  const vaultClient = new VaultClient(vaultClientConfig, logger);

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  describe('#createKey', () => {
    it('should return undefined and call log info when the vault client returns Server Error', async () => {
      let payload: unknown;
      const loggerInfoSpy = jest.spyOn(vaultClient.logger, 'info');

      const vaultNock = nock('http://localhost:8200')
        .post(`/transit/keys/keyName`, (_payload) => {
          payload = _payload;
          return true;
        })
        .reply(500);

      await expect(vaultClient.createKey('keyName')).resolves.toBeUndefined();

      vaultNock.done();

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        {
          err: Error('Internal Server Error'),
          requestDetails: {
            keyName: 'keyName',
          },
        },
        'Server error',
      );
      expect(payload).toEqual({
        type: 'ed25519',
      });
    });

    it('should log error when the vault client returns Client Error', async () => {
      let payload: unknown;
      const loggerErrorSpy = jest.spyOn(vaultClient.logger, 'error');

      const vaultNock = nock('http://localhost:8200')
        .post(`/transit/keys/keyName`, (_payload) => {
          payload = _payload;
          return true;
        })
        .reply(400);

      await expect(vaultClient.createKey('keyName')).rejects.toThrow(
        ClientError,
      );

      vaultNock.done();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        {
          err: Error('Bad Request'),
          requestDetails: {
            keyName: 'keyName',
          },
        },
        'Client error',
      );
      expect(payload).toEqual({
        type: 'ed25519',
      });
    });

    it('should correctly call the vault to create the key', async () => {
      let payload: unknown;

      const vaultNock = nock('http://localhost:8200')
        .post(`/transit/keys/keyName`, (_payload) => {
          payload = _payload;
          return true;
        })
        .reply(201);

      await expect(vaultClient.createKey('keyName')).resolves.toBeUndefined();

      expect(payload).toEqual({
        type: 'ed25519',
      });

      vaultNock.done();
    });
  });

  describe('#getPublicKey', () => {
    it('should return undefined and call log info when the vault client returns Server Error', async () => {
      const loggerInfoSpy = jest.spyOn(vaultClient.logger, 'info');
      const vaultNock = nock('http://localhost:8200')
        .get(`/transit/keys/keyName`)
        .reply(500);

      await expect(
        vaultClient.getPublicKey('keyName'),
      ).resolves.toBeUndefined();

      vaultNock.done();

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        {
          err: Error('Internal Server Error'),
          requestDetails: {
            keyName: 'keyName',
          },
        },
        'Server error',
      );
    });

    it('should throw an error and call log error when the vault client returns Client Error', async () => {
      const loggerErrorSpy = jest.spyOn(vaultClient.logger, 'error');
      const vaultNock = nock('http://localhost:8200')
        .get(`/transit/keys/keyName`)
        .reply(404);

      await expect(vaultClient.getPublicKey('keyName')).rejects.toThrow(
        ClientError,
      );

      vaultNock.done();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        {
          err: Error('Not Found'),
          requestDetails: {
            keyName: 'keyName',
          },
        },
        'Client error',
      );
    });

    it('should return the correct public key value', async () => {
      const vaultNock = nock('http://localhost:8200')
        .get(`/transit/keys/keyName`)
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
              '2': {
                creation_time: '2021-02-02T10:01:29.097094+01:00',
                name: 'ed25519',
                public_key: 'L04JMAN9Lph+aSKZz0W/KzYPOa2tnBZhaZLvSwiNzMY=',
              },
            },
            latest_version: 1,
            min_available_version: 0,
            min_decryption_version: 1,
            min_encryption_version: 0,
            name: 'keyName',
            supports_decryption: false,
            supports_derivation: true,
            supports_encryption: false,
            supports_signing: true,
            type: 'ed25519',
          },
          warnings: null,
        });

      await expect(vaultClient.getPublicKey('keyName')).resolves.toEqual(
        'L04JMAN9Lph+aSKZz0W/KzYPOa2tnBZhaZLvSwiNzMY=',
      );

      vaultNock.done();
    });
  });

  describe('#sign', () => {
    it('should return undefined and call log info when the vault client returns Server Error', async () => {
      const loggerInfoSpy = jest.spyOn(vaultClient.logger, 'info');
      const vaultNock = nock('http://localhost:8200')
        .post(`/transit/sign/keyName`)
        .reply(500);

      await expect(
        vaultClient.sign('forged', 'keyName'),
      ).resolves.toBeUndefined();

      vaultNock.done();

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        {
          err: Error('Internal Server Error'),
          requestDetails: {
            keyName: 'keyName',
            forgedOperationHash: 'forged',
          },
        },
        'Server error',
      );
    });

    it('should return undefined and call log error when the vault client returns Client Error', async () => {
      const loggerErrorSpy = jest.spyOn(vaultClient.logger, 'error');
      const vaultNock = nock('http://localhost:8200')
        .post(`/transit/sign/keyName`)
        .reply(404);

      await expect(
        vaultClient.sign('forged', 'keyName'),
      ).resolves.toBeUndefined();

      vaultNock.done();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        {
          err: Error('Not Found'),
          requestDetails: {
            keyName: 'keyName',
            forgedOperationHash: 'forged',
          },
        },
        'Client error',
      );
    });

    it('should return the correct signature', async () => {
      let payload;

      const vaultNock = nock('http://localhost:8200')
        .post(`/transit/sign/keyName`, (_payload) => {
          payload = _payload;
          return true;
        })
        .reply(200, {
          request_id: '5fa133ec-ef0f-1779-766e-55f9f54e3893',
          lease_id: '',
          lease_duration: 0,
          renewable: false,
          data: {
            key_version: 1,
            signature:
              'vault:v1:Sxc1fFnt+fC27nk2LKaBUq9HEOBUc0EMNNCZ8KqMXxosLmMJPqu80mzhWMPcZ6eD9jlEtiAqFMREv2YYn8G+BA==',
          },
          warnings: null,
        });

      await expect(vaultClient.sign('forged', 'keyName')).resolves.toEqual(
        'Sxc1fFnt+fC27nk2LKaBUq9HEOBUc0EMNNCZ8KqMXxosLmMJPqu80mzhWMPcZ6eD9jlEtiAqFMREv2YYn8G+BA==',
      );

      vaultNock.done();

      expect(payload).toEqual({
        input: 'forged',
      });
    });
  });
});
