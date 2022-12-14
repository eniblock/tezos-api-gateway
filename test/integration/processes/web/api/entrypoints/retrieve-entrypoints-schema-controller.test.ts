import supertest from 'supertest';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { TezosService } from '../../../../../../src/services/tezos';
import { logger } from '../../../../../../src/services/logger';
import * as getEntrypointsSchemaLib from '../../../../../../src/lib/entrypoints/get-entrypoint-schema';

import {
  postgreConfig,
  serverConfig,
  tezosNodeUrl,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';
import {
  FA2Contract,
  FA2Contract5,
} from '../../../../../__fixtures__/smart-contract';

describe('[processes/web/api/entrypoints] Retrieve Entrypoints Schema Controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const tezosService = new TezosService(tezosNodeUrl);
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
          'request.params.contract_address should match pattern "^KT+[0-9a-zA-Z]{34}$"',
        status: 400,
      });
    });

    it('should return 400 when one of the query entry points is not in the contract', async () => {
      const { body, status } = await request
        .get('/api/entrypoints/' + FA2Contract)
        .query({
          entryPoints: ['nonexistentEntryPoint', 'mint'],
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'The given entryPoint nonexistentEntryPoint does not exist in the contract entryPoint ' +
          'list: balance_of,mint,set_administrator,set_metadata,set_pause,transfer,update_operators',
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
        '/api/entrypoints/' + FA2Contract,
      );

      expect(status).toEqual(500);
      expect(body).toEqual({
        message: 'Internal Server Error',
        status: 500,
      });

      expect(getEntrypointSchemaSpy.mock.calls).toEqual([
        [logger, tezosService, FA2Contract, true, undefined],
      ]);
    });

    it('should return 200 and the schema of all the contract entrypoints if "entryPoint" is not defined', async () => {
      const { body, status } = await request.get(
        '/api/entrypoints/' + FA2Contract,
      );

      expect({ status, body }).toEqual({
        status: 200,
        body: {
          schema: [
            {
              entryPoint: 'balance_of',
              schema: {
                requests: {
                  list: {
                    owner: 'address',
                    token_id: 'nat',
                  },
                },
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
                    args: [
                      {
                        annots: ['%metadata'],
                        args: [{ prim: 'string' }, { prim: 'bytes' }],
                        prim: 'map',
                      },
                      { annots: ['%token_id'], prim: 'nat' },
                    ],
                    prim: 'pair',
                  },
                ],
              },
            },
            {
              entryPoint: 'set_administrator',
              schema: 'address',
              michelson: { prim: 'address' },
            },
            {
              entryPoint: 'set_metadata',
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
              schema: {
                list: {
                  from_: 'address',
                  txs: {
                    list: {
                      amount: 'nat',
                      to_: 'address',
                      token_id: 'nat',
                    },
                  },
                },
              },
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
                              {
                                args: [
                                  {
                                    annots: ['%token_id'],
                                    prim: 'nat',
                                  },
                                  {
                                    annots: ['%amount'],
                                    prim: 'nat',
                                  },
                                ],
                                prim: 'pair',
                              },
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
              schema: {
                list: {
                  add_operator: {
                    operator: 'address',
                    owner: 'address',
                    token_id: 'nat',
                  },
                  remove_operator: {
                    operator: 'address',
                    owner: 'address',
                    token_id: 'nat',
                  },
                },
              },
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
                          {
                            args: [
                              {
                                annots: ['%operator'],
                                prim: 'address',
                              },
                              {
                                annots: ['%token_id'],
                                prim: 'nat',
                              },
                            ],
                            prim: 'pair',
                          },
                        ],
                        annots: ['%add_operator'],
                      },
                      {
                        prim: 'pair',
                        args: [
                          { prim: 'address', annots: ['%owner'] },
                          {
                            args: [
                              {
                                annots: ['%operator'],
                                prim: 'address',
                              },
                              {
                                annots: ['%token_id'],
                                prim: 'nat',
                              },
                            ],
                            prim: 'pair',
                          },
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
            'set_metadata',
            'set_pause',
            'transfer',
            'update_operators',
          ],
        },
      });
    });

    it('should return 200 and the entrypoint schema when the entryPoint specified is valid', async () => {
      const { body, status } = await request
        .get('/api/entrypoints/' + FA2Contract)
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
                    args: [
                      {
                        annots: ['%metadata'],
                        args: [
                          {
                            prim: 'string',
                          },
                          {
                            prim: 'bytes',
                          },
                        ],
                        prim: 'map',
                      },
                      {
                        annots: ['%token_id'],
                        prim: 'nat',
                      },
                    ],
                    prim: 'pair',
                  },
                ],
              },
            },
          ],
          contractEntryPointsList: [
            'balance_of',
            'mint',
            'set_administrator',
            'set_metadata',
            'set_pause',
            'transfer',
            'update_operators',
          ],
        },
      });
    });

    it('should return 200 and the entrypoint schema when two valid entryPoints are specified', async () => {
      const { body, status } = await request
        .get('/api/entrypoints/' + FA2Contract)
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
                    args: [
                      {
                        prim: 'map',
                        args: [{ prim: 'string' }, { prim: 'bytes' }],
                        annots: ['%metadata'],
                      },
                      { prim: 'nat', annots: ['%token_id'] },
                    ],
                    prim: 'pair',
                  },
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
            'set_metadata',
            'set_pause',
            'transfer',
            'update_operators',
          ],
        },
      });
    });
  });
});
