import supertest from 'supertest';

import {
  postgreConfig,
  serverConfig,
  tezosNodeUrl,
} from '../../../../../__fixtures__/config';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { TezosService } from '../../../../../../src/services/tezos';
import { DataPackingParams } from '../../../../../../src/const/interfaces/utils/pack-data';
import { PostgreService } from '../../../../../../src/services/postgre';
import * as utilsLib from '../../../../../../src/lib/utils/pack-data';

describe('[processes/web/api/utils/pack-data] Pack Michelson data', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  webProcess.postgreService = new PostgreService(postgreConfig);
  const tezosService = new TezosService(tezosNodeUrl);

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
  });

  beforeEach(async () => {
    jest
      .spyOn(webProcess.gatewayPool, 'getTezosService')
      .mockResolvedValue(tezosService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  const requestBodyParam: DataPackingParams = {
    data: {
      nft_contract_address: 'KT1XdNLRwUhEnzYRJW8WZAUKcpupDFc7jerp',
      nft_id: 1,
      royalties: {
        decimals: 2,
        shares: [
          {
            key: 'tz1WxrQuZ4CK1MBUa2GqUWK1yJ4J6EtG1Gwi',
            value: 5,
          },
          {
            key: 'tz1g7KBruSWP7JERBRhKgJzezPqs4ZBDkR5B',
            value: 10,
          },
        ],
      },
    },
    type: {
      prim: 'pair',
      args: [
        { prim: 'address', annots: ['%nft_contract_address'] },
        {
          prim: 'pair',
          args: [
            { prim: 'int', annots: ['%nft_id'] },
            {
              prim: 'pair',
              args: [
                { prim: 'int', annots: ['%decimals'] },
                {
                  prim: 'map',
                  args: [{ prim: 'address' }, { prim: 'int' }],
                  annots: ['%shares'],
                },
              ],
              annots: ['%royalties'],
            },
          ],
        },
      ],
    },
  };

  it('should return 400 when a required parameter is missing', async () => {
    const { body, status } = await request.post('/api/utils/pack-data').send({
      data: 'fake data',
    });

    expect(status).toEqual(400);
    expect(body).toEqual({
      message: "request.body should have required property 'type'",
      status: 400,
    });
  });

  it('should return 400 when there is an extra parameter in request param', async () => {
    const { body, status } = await request.post('/api/utils/pack-data').send({
      ...requestBodyParam,
      extra: 'extra',
    });

    expect(status).toEqual(400);
    expect(body).toEqual({
      message: 'request.body should NOT have additional properties',
      status: 400,
    });
  });

  it('should return 400 data does not match type', async () => {
    const { body, status } = await request.post('/api/utils/pack-data').send({
      data: 'fake string',
      type: requestBodyParam.type,
    });

    expect(status).toEqual(400);
    expect(body).toEqual({
      message: '[nft_contract_address] Address is not valid: undefined',
      status: 400,
    });
  });

  it('should return 400 when a map parameter does not match the map structure', async () => {
    const { body, status } = await request.post('/api/utils/pack-data').send({
      data: {
        nft_id: 1,
        royalties: {
          key: 'tz1WxrQuZ4CK1MBUa2GqUWK1yJ4J6EtG1Gwi',
          value: 5,
        },
      },
      type: {
        prim: 'pair',
        args: [
          { prim: 'int', annots: ['%nft_id'] },
          {
            prim: 'map',
            args: [{ prim: 'address' }, { prim: 'int' }],
            annots: ['%royalties'],
          },
        ],
      },
    });

    expect(status).toEqual(400);
    expect(body).toEqual({
      message:
        'Invalid map structure, map have to respect the type: {"key": <key>, "value": <value>}[]',
      status: 400,
    });
  });

  it('should return 500 when unexpected error happen', async () => {
    jest
      .spyOn(utilsLib, 'packData')
      .mockRejectedValue(new Error('Unexpected error'));

    const { body, status } = await request
      .post('/api/utils/pack-data')
      .send(requestBodyParam);

    expect(status).toEqual(500);
    expect(body).toEqual({
      message: 'Internal Server Error',
      status: 500,
    });
  });

  it('should return 200 and return the packed data', async () => {
    const { body, status } = await request
      .post('/api/utils/pack-data')
      .send(requestBodyParam);

    expect({ body, status }).toEqual({
      status: 200,
      body: {
        packedData:
          '0507070a0000001601fcc8bfe353d8b099e0e6e675b4e2e4e925050ef1000707000107070002020000003e07040a0000001600007c38b4bb43c4340b9e33ab837130c63223aa9fd7000507040a000000160000e08b843540b7e1725f99ba5dc993af6fa7e9804a000a',
      },
    });
  }, 8000);
});
