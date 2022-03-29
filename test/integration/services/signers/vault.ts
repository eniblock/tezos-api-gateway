import nock from 'nock';

import { vaultClientConfig } from '../../../__fixtures__/config';
import { logger } from '../../../__fixtures__/services/logger';

import { VaultSigner } from '../../../../src/services/signers/vault';
import { UndefinedPublicKeyError } from '../../../../src/const/errors/undefined-public-key-error';
import { UndefinedSignatureError } from '../../../../src/const/errors/undefined-signature-error';
import { ClientError } from '../../../../src/const/errors/client-error';

describe('[services/signers] Vault', () => {
  const vaultSigner = new VaultSigner(vaultClientConfig, 'keyName', logger);

  afterEach(() => {
    jest.resetAllMocks();
    nock.cleanAll();
  });

  describe('#publicKey', () => {
    it('should return the correct value of public key', async () => {
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

      await expect(vaultSigner.publicKey()).resolves.toEqual(
        'edpkuT1ZJXh94dJFKouGrhnGGspGWV1VNQhZMmNE17e4en3xbeyGfT',
      );

      vaultNock.done();
    });

    it('should throw Client Error when vault returns client error', async () => {
      const vaultNock = nock('http://localhost:8200')
        .get(`/transit/keys/keyName`)
        .reply(423);

      await expect(vaultSigner.publicKey()).rejects.toThrow(ClientError);

      vaultNock.done();
    });

    it('should throw UndefinedPublicKey Error when vault returns server error', async () => {
      const vaultNock = nock('http://localhost:8200')
        .get(`/transit/keys/keyName`)
        .reply(500);

      await expect(vaultSigner.publicKey()).rejects.toThrow(
        UndefinedPublicKeyError,
      );

      vaultNock.done();
    });
  });

  describe('#publicKeyHash', () => {
    it('should return the correct value of public key hash', async () => {
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

      await expect(vaultSigner.publicKeyHash()).resolves.toEqual(
        'tz1UCubRycjt5kqkdBPDvmSSxHG1oZ8AX2Cu',
      );

      vaultNock.done();
    });

    it('should throw Client Error when vault returns client error', async () => {
      const vaultNock = nock('http://localhost:8200')
        .get(`/transit/keys/keyName`)
        .reply(400);

      await expect(vaultSigner.publicKeyHash()).rejects.toThrow(ClientError);

      vaultNock.done();
    });

    it('should throw UndefinedPublicKey Error when vault returns server error', async () => {
      const vaultNock = nock('http://localhost:8200')
        .get(`/transit/keys/keyName`)
        .reply(500);

      await expect(vaultSigner.publicKeyHash()).rejects.toThrow(
        UndefinedPublicKeyError,
      );

      vaultNock.done();
    });
  });

  describe('#sign', () => {
    const forgedOperation =
      'aa0f73bccbe62ab8d075f94a4c03583d47c349c1cd5747676e093a70d524fa776c005df8ceced07a0074dc1c3b17de65e19bdb8ce70ca08d068feb4a80ea30d0860300010d6eb7444a321cbddc4787b6a1714ab1789e772d00ffff087472616e736665720000002d07070100000024747a315a51594d4445546f644e42416332585662685a46476d65384b6e697550717253770001';

    it('should correctly return the sign object', async () => {
      let payload;
      const vaultNock = nock('http://localhost:8200')
        .post('/transit/sign/keyName', (_payload) => {
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
              'vault:v1:+xhxtc1p6Z1UHrNknFlhGketCtwfrla6mQ73lyQbMD5RoUOv4wqXje33w21x/vh2R7Nn1xS+SGRCW4fDdw0cDA==',
          },
          warnings: null,
        });

      await expect(
        vaultSigner.sign(forgedOperation, new Uint8Array([3])),
      ).resolves.toEqual({
        bytes:
          'aa0f73bccbe62ab8d075f94a4c03583d47c349c1cd5747676e093a70d524fa776c005df8ceced07a0074dc1c3b17de65e19bdb8ce70ca08d068feb4a80ea30d0860300010d6eb7444a321cbddc4787b6a1714ab1789e772d00ffff087472616e736665720000002d07070100000024747a315a51594d4445546f644e42416332585662685a46476d65384b6e697550717253770001',
        sbytes:
          'aa0f73bccbe62ab8d075f94a4c03583d47c349c1cd5747676e093a70d524fa776c005df8ceced07a0074dc1c3b17de65e19bdb8ce70ca08d068feb4a80ea30d0860300010d6eb7444a321cbddc4787b6a1714ab1789e772d00ffff087472616e736665720000002d07070100000024747a315a51594d4445546f644e42416332585662685a46476d65384b6e697550717253770001fb1871b5cd69e99d541eb3649c59611a47ad0adc1fae56ba990ef797241b303e51a143afe30a978dedf7c36d71fef87647b367d714be4864425b87c3770d1c0c',
        prefixSig:
          'edsigu6f646JFgo5XGMevcTu7U6j15RWY3zJVVpf9zEMX36nvhzhnCVViftZ6gGWQqxNJkhsy91vV3RBvTmaj6rK9xHPh8yR5w6',
        sig: 'sigvqcw35MQrtVDAfdUS3vWoSVJbRc5MRu88uRFtMY2kmyQAmBhbadaqKBdftckVBxKAQMDW98CoE9iyYXShyBmEKbEqkPUh',
      });
      expect(payload).toEqual({
        input: 'jBdhzWHiibMj8MikNGxZZQjLt9U5ijSB698mI55Yn3M=',
      });

      vaultNock.done();
    });

    it('should correctly return the sign object without adding any default watermark', async () => {
      let payload;
      const vaultNock = nock('http://localhost:8200')
        .post('/transit/sign/keyName', (_payload) => {
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
              'vault:v1:+xhxtc1p6Z1UHrNknFlhGketCtwfrla6mQ73lyQbMD5RoUOv4wqXje33w21x/vh2R7Nn1xS+SGRCW4fDdw0cDA==',
          },
          warnings: null,
        });

      await expect(vaultSigner.sign(forgedOperation)).resolves.toEqual({
        bytes:
          'aa0f73bccbe62ab8d075f94a4c03583d47c349c1cd5747676e093a70d524fa776c005df8ceced07a0074dc1c3b17de65e19bdb8ce70ca08d068feb4a80ea30d0860300010d6eb7444a321cbddc4787b6a1714ab1789e772d00ffff087472616e736665720000002d07070100000024747a315a51594d4445546f644e42416332585662685a46476d65384b6e697550717253770001',
        sbytes:
          'aa0f73bccbe62ab8d075f94a4c03583d47c349c1cd5747676e093a70d524fa776c005df8ceced07a0074dc1c3b17de65e19bdb8ce70ca08d068feb4a80ea30d0860300010d6eb7444a321cbddc4787b6a1714ab1789e772d00ffff087472616e736665720000002d07070100000024747a315a51594d4445546f644e42416332585662685a46476d65384b6e697550717253770001fb1871b5cd69e99d541eb3649c59611a47ad0adc1fae56ba990ef797241b303e51a143afe30a978dedf7c36d71fef87647b367d714be4864425b87c3770d1c0c',
        prefixSig:
          'edsigu6f646JFgo5XGMevcTu7U6j15RWY3zJVVpf9zEMX36nvhzhnCVViftZ6gGWQqxNJkhsy91vV3RBvTmaj6rK9xHPh8yR5w6',
        sig: 'sigvqcw35MQrtVDAfdUS3vWoSVJbRc5MRu88uRFtMY2kmyQAmBhbadaqKBdftckVBxKAQMDW98CoE9iyYXShyBmEKbEqkPUh',
      });
      expect(payload).toEqual({
        input: 'ZJWEj0RYf8+69+nl8FsATQE2xLpgxNXZ2691u5ohMs4=',
      });

      vaultNock.done();
    });

    it('should correctly return the sign object with the forged operation and watermarks', async () => {
      let payload;
      const vaultNock = nock('http://localhost:8200')
        .post('/transit/sign/keyName', (_payload) => {
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
              'vault:v1:CesnVTeXCAgNLMk/ygrr9648xIg42km1oeNrc3zMyDT5ZvTIKcgGQe8/e/IsoXY0cf5sOmm4ucczyApDICaxBw==',
          },
          warnings: null,
        });

      await expect(
        vaultSigner.sign(forgedOperation, new Uint8Array([4])),
      ).resolves.toEqual({
        bytes:
          'aa0f73bccbe62ab8d075f94a4c03583d47c349c1cd5747676e093a70d524fa776c005df8ceced07a0074dc1c3b17de65e19bdb8ce70ca08d068feb4a80ea30d0860300010d6eb7444a321cbddc4787b6a1714ab1789e772d00ffff087472616e736665720000002d07070100000024747a315a51594d4445546f644e42416332585662685a46476d65384b6e697550717253770001',
        sbytes:
          'aa0f73bccbe62ab8d075f94a4c03583d47c349c1cd5747676e093a70d524fa776c005df8ceced07a0074dc1c3b17de65e19bdb8ce70ca08d068feb4a80ea30d0860300010d6eb7444a321cbddc4787b6a1714ab1789e772d00ffff087472616e736665720000002d07070100000024747a315a51594d4445546f644e42416332585662685a46476d65384b6e69755071725377000109eb2755379708080d2cc93fca0aebf7ae3cc48838da49b5a1e36b737cccc834f966f4c829c80641ef3f7bf22ca1763471fe6c3a69b8b9c733c80a432026b107',
        prefixSig:
          'edsigtZ72Qk9Qb8yhGcqjY4NTURWXquq6XajVwryQLHb5nS9x6bUbFRadKZbQEA19VST3RokaFSQqaZXzGqLdRbobs2TxgvDDsf',
        sig: 'sigPHZHgvWKCnfDRrSQ2XGX8E255kAYwruaBDfbwb6n68znmXzkXfYEWMVBZPMPyGgzGGxKvdUjwaDY3JRmTTdfyPrkx6pgC',
      });
      expect(payload).toEqual({
        input: 'jt7NhCwiiJPStcAuMzYtoZ4aU+TW9bPMI5PPAkfSSGE=',
      });

      vaultNock.done();
    });

    it('should throw UndefinedPublicKey Error when vault returns any error', async () => {
      let payload;

      const vaultNock = nock('http://localhost:8200')
        .post('/transit/sign/keyName', (_payload) => {
          payload = _payload;
          return true;
        })
        .reply(500);

      await expect(
        vaultSigner.sign(forgedOperation, new Uint8Array([3])),
      ).rejects.toThrow(UndefinedSignatureError);

      expect(payload).toEqual({
        input: 'jBdhzWHiibMj8MikNGxZZQjLt9U5ijSB698mI55Yn3M=',
      });

      vaultNock.done();
    });
  });
});
