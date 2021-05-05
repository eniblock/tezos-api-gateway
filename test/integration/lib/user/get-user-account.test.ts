import * as userLib from '../../../../src/lib/user/get-user-account';
import nock from 'nock';

describe('[lib/user/get-user-account]', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#getUserAccounts', () => {
    it('should return the account addresses of the specified users', async () => {
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

      const accounts = await userLib.getUserAccounts(['key1', 'key2']);

      vaultNock1.done();
      vaultNock2.done();

      expect(accounts[0].userId).toEqual('key1');
      expect(accounts[0].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      expect(accounts[1].userId).toEqual('key2');
      expect(accounts[1].account).toMatch(/tz[0-9a-zA-Z]{34}/);
    });

    it('should throw an error and log error if unexpected error happened', async () => {
      jest
        .spyOn(userLib, 'getUserAccounts')
        .mockRejectedValue(new Error('Unexpected error'));

      await expect(userLib.getUserAccounts(['key1', 'key2'])).rejects.toThrow(
        Error('Unexpected error'),
      );
    });

    it('should return a null account address for an unknown user Id ', async () => {
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
      const vaultNock3 = nock('http://localhost:8300')
        .get(`/v1/transit/keys/key3`)
        .reply(404);
      const accounts = await userLib.getUserAccounts(['key1', 'key3']);

      vaultNock1.done();
      vaultNock3.done();

      expect(accounts[0].userId).toEqual('key1');
      expect(accounts[0].account).toMatch(/tz[0-9a-zA-Z]{34}/);
      expect(accounts[1].userId).toEqual('key3');
      expect(accounts[1].account).toEqual(null);
    });
  });
});
