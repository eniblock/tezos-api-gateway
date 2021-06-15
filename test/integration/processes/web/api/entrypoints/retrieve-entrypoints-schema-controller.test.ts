import supertest from 'supertest';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { TezosService } from '../../../../../../src/services/tezos';
import { logger } from '../../../../../../src/services/logger';
import * as getEntrypointsSchemaLib from '../../../../../../src/lib/entrypoints/get-entrypoint-schema';

import {
  postgreConfig,
  serverConfig,
  tezosNodeEdonetUrl,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';
import { FA2Contract2, FA2Contract5, FA2Contract6 } from '../../../../../__fixtures__/smart-contract';

describe('[processes/web/api/entrypoints] Retrieve Entrypoints Schema Controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const tezosService = new TezosService(tezosNodeEdonetUrl);
  const postgreService = new PostgreService(postgreConfig);

  webProcess.postgreService = postgreService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
  });

  beforeEach(() => {
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

  describe('#retrieveEntrypointsSchemaFromTezosNode', () => {
    it('should return 400 when the contract address does not have a good format', async () => {
      const { body, status } = await request.get('/api/entrypoints/123');

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.params.contract_address should match pattern "^[0-9a-zA-Z]{36}$"',
        status: 400,
      });
    });

    it('should return 400 when one of the query entry points is not in the contract', async () => {
      const { body, status } = await request
        .get('/api/entrypoints/' + FA2Contract2)
        .query({
          entryPoints: ['nonexistentEntryPoint', 'mint'],
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'The given entryPoint nonexistentEntryPoint does not exist in the contract entryPoint ' +
          'list: balance_of,mint,set_administrator,set_metdata,set_pause,transfer,update_operators',
        status: 400,
      });
    });

    it('should return 404 when the contract address does not exist', async () => {
      const { body, status } = await request.get(
        '/api/entrypoints/' + FA2Contract5,
      );

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: 'Http error response: (404) ',
        status: 404,
      });
    });

    it('should return 500 when unexpected error happen', async () => {
      const getEntrypointSchemaSpy = jest
        .spyOn(getEntrypointsSchemaLib, 'getEntryPointSchemaFromTezosNode')
        .mockRejectedValue(new Error());

      const { body, status } = await request.get(
        '/api/entrypoints/' + FA2Contract6,
      );

      expect(status).toEqual(500);
      expect(body).toEqual({
        message: 'Internal Server Error',
        status: 500,
      });

      expect(getEntrypointSchemaSpy.mock.calls).toEqual([
        [
          logger,
          tezosService,
          FA2Contract6,
          undefined,
        ],
      ]);
    });

    it('should return 200 and the schema of all the contract entrypoints if "entryPoint" is not defined', async () => {
      const { body, status } = await request.get(
        '/api/entrypoints/' + FA2Contract2,
      );

      expect({ status, body }).toEqual({
        status: 200,
        body: {
          schema: [
            {
              entryPoint: 'balance_of',
              schema: {
                requests: 'list',
                callback: 'contract',
              },
              michelson: {
                prim: 'pair',
                args: [
                  {
                    prim: 'list',
                    args: [
                      {
                        prim: 'pair',
                        args: [
                          { prim: 'address', annots: ['%owner'] },
                          { prim: 'nat', annots: ['%token_id'] },
                        ],
                      },
                    ],
                    annots: ['%requests'],
                  },
                  {
                    prim: 'contract',
                    args: [
                      {
                        prim: 'list',
                        args: [
                          {
                            prim: 'pair',
                            args: [
                              {
                                prim: 'pair',
                                args: [
                                  { prim: 'address', annots: ['%owner'] },
                                  { prim: 'nat', annots: ['%token_id'] },
                                ],
                                annots: ['%request'],
                              },
                              { prim: 'nat', annots: ['%balance'] },
                            ],
                          },
                        ],
                      },
                    ],
                    annots: ['%callback'],
                  },
                ],
              },
            },
            {
              entryPoint: 'mint',
              schema: {
                address: 'address',
                amount: 'nat',
                metadata: {
                  map: {
                    key: 'string',
                    value: 'bytes',
                  },
                },
                token_id: 'nat',
              },
              michelson: {
                prim: 'pair',
                args: [
                  {
                    prim: 'pair',
                    args: [
                      { prim: 'address', annots: ['%address'] },
                      { prim: 'nat', annots: ['%amount'] },
                    ],
                  },
                  {
                    prim: 'map',
                    args: [{ prim: 'string' }, { prim: 'bytes' }],
                    annots: ['%metadata'],
                  },
                  { prim: 'nat', annots: ['%token_id'] },
                ],
              },
            },
            {
              entryPoint: 'set_administrator',
              schema: 'address',
              michelson: { prim: 'address' },
            },
            {
              entryPoint: 'set_metdata',
              schema: {
                k: 'string',
                v: 'bytes',
              },
              michelson: {
                prim: 'pair',
                args: [
                  { prim: 'string', annots: ['%k'] },
                  { prim: 'bytes', annots: ['%v'] },
                ],
              },
            },
            {
              entryPoint: 'set_pause',
              schema: 'bool',
              michelson: { prim: 'bool' },
            },
            {
              entryPoint: 'transfer',
              schema: 'list',
              michelson: {
                prim: 'list',
                args: [
                  {
                    prim: 'pair',
                    args: [
                      { prim: 'address', annots: ['%from_'] },
                      {
                        prim: 'list',
                        args: [
                          {
                            prim: 'pair',
                            args: [
                              { prim: 'address', annots: ['%to_'] },
                              { prim: 'nat', annots: ['%token_id'] },
                              { prim: 'nat', annots: ['%amount'] },
                            ],
                          },
                        ],
                        annots: ['%txs'],
                      },
                    ],
                  },
                ],
              },
            },
            {
              entryPoint: 'update_operators',
              schema: 'list',
              michelson: {
                prim: 'list',
                args: [
                  {
                    prim: 'or',
                    args: [
                      {
                        prim: 'pair',
                        args: [
                          { prim: 'address', annots: ['%owner'] },
                          { prim: 'address', annots: ['%operator'] },
                          { prim: 'nat', annots: ['%token_id'] },
                        ],
                        annots: ['%add_operator'],
                      },
                      {
                        prim: 'pair',
                        args: [
                          { prim: 'address', annots: ['%owner'] },
                          { prim: 'address', annots: ['%operator'] },
                          { prim: 'nat', annots: ['%token_id'] },
                        ],
                        annots: ['%remove_operator'],
                      },
                    ],
                  },
                ],
              },
            },
          ],
          contractEntryPointsList: [
            'balance_of',
            'mint',
            'set_administrator',
            'set_metdata',
            'set_pause',
            'transfer',
            'update_operators',
          ],
        },
      });
    });

    it('should return 200 and the entrypoint schema when the entryPoint specified is valid', async () => {
      const { body, status } = await request
        .get('/api/entrypoints/' + FA2Contract2)
        .query({
          entryPoints: ['mint'],
        });

      expect({ status, body }).toEqual({
        status: 200,
        body: {
          schema: [
            {
              entryPoint: 'mint',
              schema: {
                address: 'address',
                amount: 'nat',
                metadata: {
                  map: {
                    key: 'string',
                    value: 'bytes',
                  },
                },
                token_id: 'nat',
              },
              michelson: {
                prim: 'pair',
                args: [
                  {
                    prim: 'pair',
                    args: [
                      { prim: 'address', annots: ['%address'] },
                      { prim: 'nat', annots: ['%amount'] },
                    ],
                  },
                  {
                    prim: 'map',
                    args: [{ prim: 'string' }, { prim: 'bytes' }],
                    annots: ['%metadata'],
                  },
                  { prim: 'nat', annots: ['%token_id'] },
                ],
              },
            },
          ],
          contractEntryPointsList: [
            'balance_of',
            'mint',
            'set_administrator',
            'set_metdata',
            'set_pause',
            'transfer',
            'update_operators',
          ],
        },
      });
    });

    it('should return 200 and the entrypoint schema when two valid entryPoints are specified', async () => {
      const { body, status } = await request
        .get('/api/entrypoints/' + FA2Contract2)
        .query({
          entryPoints: ['mint', 'set_pause'],
        });

      expect({ status, body }).toEqual({
        status: 200,
        body: {
          schema: [
            {
              entryPoint: 'mint',
              schema: {
                address: 'address',
                amount: 'nat',
                metadata: {
                  map: {
                    key: 'string',
                    value: 'bytes',
                  },
                },
                token_id: 'nat',
              },
              michelson: {
                prim: 'pair',
                args: [
                  {
                    prim: 'pair',
                    args: [
                      { prim: 'address', annots: ['%address'] },
                      { prim: 'nat', annots: ['%amount'] },
                    ],
                  },
                  {
                    prim: 'map',
                    args: [{ prim: 'string' }, { prim: 'bytes' }],
                    annots: ['%metadata'],
                  },
                  { prim: 'nat', annots: ['%token_id'] },
                ],
              },
            },
            {
              entryPoint: 'set_pause',
              schema: 'bool',
              michelson: { prim: 'bool' },
            },
          ],
          contractEntryPointsList: [
            'balance_of',
            'mint',
            'set_administrator',
            'set_metdata',
            'set_pause',
            'transfer',
            'update_operators',
          ],
        },
      });
    });
  });
});
