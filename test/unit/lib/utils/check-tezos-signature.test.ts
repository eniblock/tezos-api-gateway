import { checkTezosSignature } from '../../../../src/lib/utils/check-signature';

describe('[lib/utils/check-signature] checkTezosSignature', () => {
  const validSignatureCheckArgs = {
    signature:
      'edsigtcTjLrTq1V2sLprMzxSZbkChaFnuUjiobQ5P7WQb3N2yjsTaomrA3pc9jnEfFmegcCBpQ3FUXXEJXNSebhaUjcS51KJRdw',
    publicKey: 'edpkvYNexGW6PT5qxvwaahjsFJT72FTvynxMimTwXggTA3yw2ebpMU',
    hexData:
      '0507070a00000016000072962502e07fb0735e918f3d84c996733c01be2e0707008bc1f1a70c0a000000160000974452a440a4cfe60d550ec6cbb880bbd21f6613',
  };
  const validOperationSignature =
    'edsigteK42KWYdChLCTKidUQNts9sAru4zPGLrANAvbRuFkj6Va7DqTuGMUMqQS3QjN3qRyjCEZyouzRjkRbQvQdTAzjWNTkrUt';

  it('Should return true when the signature is valid', async () => {
    const result = await checkTezosSignature(
      validSignatureCheckArgs.signature,
      validSignatureCheckArgs.publicKey,
      validSignatureCheckArgs.hexData,
    );
    expect(result).toEqual(true);
  });

  it('Should return true when the signature is valid and operationPrefix is false', async () => {
    const result = await checkTezosSignature(
      validSignatureCheckArgs.signature,
      validSignatureCheckArgs.publicKey,
      validSignatureCheckArgs.hexData,
      false,
    );
    expect(result).toEqual(true);
  });

  it('Should return true when the signature is valid and operationPrefix is undefined', async () => {
    const result = await checkTezosSignature(
      validSignatureCheckArgs.signature,
      validSignatureCheckArgs.publicKey,
      validSignatureCheckArgs.hexData,
      undefined,
    );
    expect(result).toEqual(true);
  });

  it('Should return false when the signature is not valid', async () => {
    const result = await checkTezosSignature(
      validSignatureCheckArgs.signature,
      validSignatureCheckArgs.publicKey,
      '0507070a0000001601fcc8e353',
    );
    expect(result).toEqual(false);
  });

  it('Should return false when the signature is valid for a simple payload, but the operationPrefix is true', async () => {
    const result = await checkTezosSignature(
      validSignatureCheckArgs.signature,
      validSignatureCheckArgs.publicKey,
      validSignatureCheckArgs.hexData,
      true,
    );
    expect(result).toEqual(false);
  });

  it('Should return true when the signature is valid for an operation, (operationPrefix is true)', async () => {
    const result = await checkTezosSignature(
      validOperationSignature,
      validSignatureCheckArgs.publicKey,
      validSignatureCheckArgs.hexData,
      true,
    );
    expect(result).toEqual(true);
  });

  it('Should return false when the signature is valid for an operation, but the operationPrefix is false', async () => {
    const result = await checkTezosSignature(
      validOperationSignature,
      validSignatureCheckArgs.publicKey,
      validSignatureCheckArgs.hexData,
      false,
    );
    expect(result).toEqual(false);
  });

  it('Should throw an error when the signature is badly formatted', async () => {
    await expect(
      checkTezosSignature(
        'fake signature',
        validSignatureCheckArgs.publicKey,
        validSignatureCheckArgs.hexData,
      ),
    ).rejects.toHaveProperty('message', 'Non-base58 character');
  });

  it('Should throw an error when the public key is badly formatted', async () => {
    await expect(
      checkTezosSignature(
        validSignatureCheckArgs.signature,
        'fake public key',
        validSignatureCheckArgs.hexData,
      ),
    ).rejects.toHaveProperty('message', 'Non-base58 character');
  });
});
