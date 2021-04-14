import { getEntryPointSchemaFromTezosNode } from '../../../../src/lib/entrypoints/get-entrypoint-schema';
import { ClientError } from '../../../../src/const/errors/client-error';
import { TezosService } from '../../../../src/services/tezos';

import { tezosNodeEdonetUrl } from '../../../__fixtures__/config';
import { logger } from '../../../__fixtures__/services/logger';

describe('[lib/entrypoints/get-entrypoint-schema]', () => {
  const tezosService = new TezosService(tezosNodeEdonetUrl);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#getEntryPointSchemaFromTezosNode', () => {
    it('should correctly return the schema of all contract entry points', async () => {
      const schema = await getEntryPointSchemaFromTezosNode(
        logger,
        tezosService,
        'KT1NjK4eGjLbWHB1M75tGbAsPatPCLudTKp1',
      );

      expect(schema).toBeDefined();
      expect(schema).toEqual({
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
      });
    });

    it('should throw error when one of the query entry points is not in the contract', async () => {
      await expect(
        getEntryPointSchemaFromTezosNode(
          logger,
          tezosService,
          'KT1NjK4eGjLbWHB1M75tGbAsPatPCLudTKp1',
          ['nonexistentEntryPoint', 'mint'],
        ),
      ).rejects.toThrow(
        new ClientError({
          message:
            'The given entryPoint nonexistentEntryPoint does not exist in the contract entryPoint ' +
            'list: balance_of,mint,set_administrator,set_metdata,set_pause,transfer,update_operators',
          status: 400,
        }),
      );
    });

    it('should throw an error and log error if unexpected error happened', async () => {
      const getEntryPointsSpy = jest
        .spyOn(tezosService, 'getContract')
        .mockRejectedValue(new Error('Unexpected error'));

      await expect(
        getEntryPointSchemaFromTezosNode(
          logger,
          tezosService,
          'KT1NjK4eGjLbWHB1M75tGbAsPatPCLudTKp1',
        ),
      ).rejects.toThrow(Error('Unexpected error'));

      expect(getEntryPointsSpy.mock.calls).toEqual([
        ['KT1NjK4eGjLbWHB1M75tGbAsPatPCLudTKp1'],
      ]);
    });

    it('should correctly return the parameter schema object with only the mentioned entrypoint', async () => {
      const schema = await getEntryPointSchemaFromTezosNode(
        logger,
        tezosService,
        'KT1NjK4eGjLbWHB1M75tGbAsPatPCLudTKp1',
        ['mint'],
      );

      expect(schema).toEqual({
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
      });
    });

    it('should correctly return the parameter schema object with only the mentioned entrypoints array', async () => {
      const schema = await getEntryPointSchemaFromTezosNode(
        logger,
        tezosService,
        'KT1NjK4eGjLbWHB1M75tGbAsPatPCLudTKp1',
        ['mint', 'update_operators'],
      );

      expect(schema).toEqual({
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
      });
    });
  });
});
