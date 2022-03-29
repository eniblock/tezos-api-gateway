import supertest from 'supertest';

import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import * as utilsLib from '../../../../../../src/lib/utils/check-signature';
import { CheckSignatureParams } from '../../../../../../src/const/interfaces/utils/check-signature';
import { PostgreService } from '../../../../../../src/services/postgre';

describe('[processes/web/api/utils/check-signature] Pack Michelson data', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  webProcess.postgreService = new PostgreService(postgreConfig);

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  const requestBodyParam: CheckSignatureParams = {
    signature:
      'edsigtyMscdmpDVX1P5PetJsdbdbJu1w4jQCF2sr4H2NEW8LL1QbdoJvJTbnViQtrZSPHuYKPK3gyUMCxh83LVmL1Lg6qjgaQe4',
    publicKey: 'edpkvMXVs7DKp42qxnmYev7S81cmpjZVaWZQh52yKPmQeGyvMYoBaA',
    hexData:
      '0507070a0000001601fcc8bfe353d8b099e0e6e675b4e2e4e925050ef1000707000107070002020000003e07040a0000001600007c38b4bb43c4340b9e33ab837130c63223aa9fd7000507040a000000160000e08b843540b7e1725f99ba5dc993af6fa7e9804a000a',
  };

  it('should return 400 when a required parameter is missing', async () => {
    const { body, status } = await request
      .post('/api/utils/check-signature')
      .send({
        hexData: requestBodyParam.hexData,
        signature: requestBodyParam.signature,
      });

    expect(status).toEqual(400);
    expect(body).toEqual({
      message: "request.body should have required property 'publicKey'",
      status: 400,
    });
  });

  it('should return 400 when there is an extra parameter in request param', async () => {
    const { body, status } = await request
      .post('/api/utils/check-signature')
      .send({
        ...requestBodyParam,
        extra: 'extra',
      });

    expect(status).toEqual(400);
    expect(body).toEqual({
      message: 'request.body should NOT have additional properties',
      status: 400,
    });
  });

  it('should return 400 when the signature is invalid', async () => {
    const { body, status } = await request
      .post('/api/utils/check-signature')
      .send({
        signature: 'fake signature',
        publicKey: requestBodyParam.publicKey,
        hexData: requestBodyParam.hexData,
      });

    expect(status).toEqual(400);
    expect(body).toEqual({
      message:
        'request.body.signature should match pattern "^edsig+[0-9a-zA-Z]{94}$"',
      status: 400,
    });
  });

  it('should return 400 when the public key is invalid', async () => {
    const { body, status } = await request
      .post('/api/utils/check-signature')
      .send({
        signature: requestBodyParam.signature,
        publicKey: 'fake public key',
        hexData: requestBodyParam.hexData,
      });

    expect(status).toEqual(400);
    expect(body).toEqual({
      message:
        'request.body.publicKey should match pattern "^edpk+[0-9a-zA-Z]{50}$"',
      status: 400,
    });
  });

  it('should return 400 when the hex data is invalid', async () => {
    const { body, status } = await request
      .post('/api/utils/check-signature')
      .send({
        signature: requestBodyParam.signature,
        publicKey: requestBodyParam.publicKey,
        hexData: 'fake hex data',
      });

    expect(status).toEqual(400);
    expect(body).toEqual({
      message:
        'request.body.hexData should match pattern "^(0x|0X)?([a-fA-F0-9][a-fA-F0-9])+$"',
      status: 400,
    });
  });

  it('should return 500 when unexpected error happen', async () => {
    jest.spyOn(utilsLib, 'checkTezosSignature').mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const { body, status } = await request
      .post('/api/utils/check-signature')
      .send(requestBodyParam);

    expect(status).toEqual(500);
    expect(body).toEqual({
      message: 'Internal Server Error',
      status: 500,
    });
  });

  it('should return 200 and return true when the signature is valid', async () => {
    const { body, status } = await request
      .post('/api/utils/check-signature')
      .send(requestBodyParam);

    expect({ body, status }).toEqual({
      status: 200,
      body: {
        result: true,
      },
    });
  }, 8000);

  it('should return 200 and return false when the signature is invalid', async () => {
    const { body, status } = await request
      .post('/api/utils/check-signature')
      .send({
        signature: requestBodyParam.signature,
        publicKey: requestBodyParam.publicKey,
        hexData: '0x7c38b4bb43c4340b9e33ab837130c63223aa9fd70005',
      });

    expect({ body, status }).toEqual({
      status: 200,
      body: {
        result: false,
      },
    });
  });

  it('should return 200 and return true when the signature is valid and the operationPrefix param is true', async () => {
    const { body, status } = await request
      .post('/api/utils/check-signature')
      .query({ operationPrefix: true })
      .send({
        signature:
          'edsigteK42KWYdChLCTKidUQNts9sAru4zPGLrANAvbRuFkj6Va7DqTuGMUMqQS3QjN3qRyjCEZyouzRjkRbQvQdTAzjWNTkrUt',
        publicKey: 'edpkvYNexGW6PT5qxvwaahjsFJT72FTvynxMimTwXggTA3yw2ebpMU',
        hexData:
          '0507070a00000016000072962502e07fb0735e918f3d84c996733c01be2e0707008bc1f1a70c0a000000160000974452a440a4cfe60d550ec6cbb880bbd21f6613',
      });

    expect({ body, status }).toEqual({
      status: 200,
      body: {
        result: true,
      },
    });
  });
});
