import supertest from 'supertest';
import { WebProcess } from '../../../../../../src/processes/web/web-process';
import {
  postgreConfig,
  serverConfig,
  tezosNodeUrl,
} from '../../../../../__fixtures__/config';
import { TezosService } from '../../../../../../src/services/tezos';
import { SignerFactory } from '../../../../../../src/services/signer-factory';
import { FakeSigner } from '../../../../../../src/services/signers/fake-signer';
import { PostgreService } from '../../../../../../src/services/postgre';

describe('[processes/web/api/storage] Deploy Contract Controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const tezosService = new TezosService(tezosNodeUrl);
  const postgreService = new PostgreService(postgreConfig);
  const fakeSigner = new FakeSigner('pkh', '');
  const signerFactory = new SignerFactory();

  webProcess.postgreService = postgreService;

  const codeJson = [
    {
      prim: 'storage',
      args: [
        {
          prim: 'pair',
          args: [
            {
              prim: 'pair',
              args: [
                {
                  prim: 'pair',
                  args: [
                    { prim: 'address', annots: ['%administrator'] },
                    { prim: 'nat', annots: ['%all_tokens'] },
                  ],
                },
                {
                  prim: 'pair',
                  args: [
                    {
                      prim: 'big_map',
                      args: [
                        {
                          prim: 'pair',
                          args: [{ prim: 'address' }, { prim: 'nat' }],
                        },
                        { prim: 'nat' },
                      ],
                      annots: ['%ledger'],
                    },
                    {
                      prim: 'big_map',
                      args: [{ prim: 'string' }, { prim: 'bytes' }],
                      annots: ['%metadata'],
                    },
                  ],
                },
              ],
            },
            {
              prim: 'pair',
              args: [
                {
                  prim: 'pair',
                  args: [
                    {
                      prim: 'big_map',
                      args: [
                        {
                          prim: 'pair',
                          args: [
                            { prim: 'address', annots: ['%owner'] },
                            {
                              prim: 'pair',
                              args: [
                                { prim: 'address', annots: ['%operator'] },
                                { prim: 'nat', annots: ['%token_id'] },
                              ],
                            },
                          ],
                        },
                        { prim: 'unit' },
                      ],
                      annots: ['%operators'],
                    },
                    { prim: 'bool', annots: ['%paused'] },
                  ],
                },
                {
                  prim: 'pair',
                  args: [
                    {
                      prim: 'big_map',
                      args: [
                        { prim: 'nat' },
                        {
                          prim: 'pair',
                          args: [
                            { prim: 'nat', annots: ['%token_id'] },
                            {
                              prim: 'map',
                              args: [{ prim: 'string' }, { prim: 'bytes' }],
                              annots: ['%token_info'],
                            },
                          ],
                        },
                      ],
                      annots: ['%token_metadata'],
                    },
                    {
                      prim: 'big_map',
                      args: [{ prim: 'nat' }, { prim: 'nat' }],
                      annots: ['%total_supply'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      prim: 'parameter',
      args: [
        {
          prim: 'or',
          args: [
            {
              prim: 'or',
              args: [
                {
                  prim: 'or',
                  args: [
                    {
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
                      annots: ['%balance_of'],
                    },
                    {
                      prim: 'pair',
                      args: [
                        { prim: 'address', annots: ['%address'] },
                        {
                          prim: 'pair',
                          args: [
                            { prim: 'nat', annots: ['%first_token_id'] },
                            {
                              prim: 'list',
                              args: [{ prim: 'bytes' }],
                              annots: ['%metadata_links'],
                            },
                          ],
                        },
                      ],
                      annots: ['%batch_mint'],
                    },
                  ],
                },
                {
                  prim: 'or',
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
                      annots: ['%burn'],
                    },
                    {
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
                          prim: 'pair',
                          args: [
                            {
                              prim: 'map',
                              args: [{ prim: 'string' }, { prim: 'bytes' }],
                              annots: ['%metadata'],
                            },
                            { prim: 'nat', annots: ['%token_id'] },
                          ],
                        },
                      ],
                      annots: ['%mint'],
                    },
                  ],
                },
              ],
            },
            {
              prim: 'or',
              args: [
                {
                  prim: 'or',
                  args: [
                    { prim: 'address', annots: ['%set_administrator'] },
                    {
                      prim: 'pair',
                      args: [
                        { prim: 'string', annots: ['%k'] },
                        { prim: 'bytes', annots: ['%v'] },
                      ],
                      annots: ['%set_metadata'],
                    },
                  ],
                },
                {
                  prim: 'or',
                  args: [
                    { prim: 'bool', annots: ['%set_pause'] },
                    {
                      prim: 'or',
                      args: [
                        {
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
                                          prim: 'pair',
                                          args: [
                                            {
                                              prim: 'nat',
                                              annots: ['%token_id'],
                                            },
                                            {
                                              prim: 'nat',
                                              annots: ['%amount'],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                  annots: ['%txs'],
                                },
                              ],
                            },
                          ],
                          annots: ['%transfer'],
                        },
                        {
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
                                      prim: 'pair',
                                      args: [
                                        {
                                          prim: 'address',
                                          annots: ['%operator'],
                                        },
                                        { prim: 'nat', annots: ['%token_id'] },
                                      ],
                                    },
                                  ],
                                  annots: ['%add_operator'],
                                },
                                {
                                  prim: 'pair',
                                  args: [
                                    { prim: 'address', annots: ['%owner'] },
                                    {
                                      prim: 'pair',
                                      args: [
                                        {
                                          prim: 'address',
                                          annots: ['%operator'],
                                        },
                                        { prim: 'nat', annots: ['%token_id'] },
                                      ],
                                    },
                                  ],
                                  annots: ['%remove_operator'],
                                },
                              ],
                            },
                          ],
                          annots: ['%update_operators'],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      prim: 'code',
      args: [
        [
          {
            prim: 'CAST',
            args: [
              {
                prim: 'pair',
                args: [
                  {
                    prim: 'or',
                    args: [
                      {
                        prim: 'or',
                        args: [
                          {
                            prim: 'or',
                            args: [
                              {
                                prim: 'pair',
                                args: [
                                  {
                                    prim: 'list',
                                    args: [
                                      {
                                        prim: 'pair',
                                        args: [
                                          { prim: 'address' },
                                          { prim: 'nat' },
                                        ],
                                      },
                                    ],
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
                                                  { prim: 'address' },
                                                  { prim: 'nat' },
                                                ],
                                              },
                                              { prim: 'nat' },
                                            ],
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                              {
                                prim: 'pair',
                                args: [
                                  { prim: 'address' },
                                  {
                                    prim: 'pair',
                                    args: [
                                      { prim: 'nat' },
                                      {
                                        prim: 'list',
                                        args: [{ prim: 'bytes' }],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                          {
                            prim: 'or',
                            args: [
                              {
                                prim: 'list',
                                args: [
                                  {
                                    prim: 'pair',
                                    args: [
                                      { prim: 'address' },
                                      { prim: 'nat' },
                                    ],
                                  },
                                ],
                              },
                              {
                                prim: 'pair',
                                args: [
                                  {
                                    prim: 'pair',
                                    args: [
                                      { prim: 'address' },
                                      { prim: 'nat' },
                                    ],
                                  },
                                  {
                                    prim: 'pair',
                                    args: [
                                      {
                                        prim: 'map',
                                        args: [
                                          { prim: 'string' },
                                          { prim: 'bytes' },
                                        ],
                                      },
                                      { prim: 'nat' },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      {
                        prim: 'or',
                        args: [
                          {
                            prim: 'or',
                            args: [
                              { prim: 'address' },
                              {
                                prim: 'pair',
                                args: [{ prim: 'string' }, { prim: 'bytes' }],
                              },
                            ],
                          },
                          {
                            prim: 'or',
                            args: [
                              { prim: 'bool' },
                              {
                                prim: 'or',
                                args: [
                                  {
                                    prim: 'list',
                                    args: [
                                      {
                                        prim: 'pair',
                                        args: [
                                          { prim: 'address' },
                                          {
                                            prim: 'list',
                                            args: [
                                              {
                                                prim: 'pair',
                                                args: [
                                                  { prim: 'address' },
                                                  {
                                                    prim: 'pair',
                                                    args: [
                                                      { prim: 'nat' },
                                                      { prim: 'nat' },
                                                    ],
                                                  },
                                                ],
                                              },
                                            ],
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                  {
                                    prim: 'list',
                                    args: [
                                      {
                                        prim: 'or',
                                        args: [
                                          {
                                            prim: 'pair',
                                            args: [
                                              { prim: 'address' },
                                              {
                                                prim: 'pair',
                                                args: [
                                                  { prim: 'address' },
                                                  { prim: 'nat' },
                                                ],
                                              },
                                            ],
                                          },
                                          {
                                            prim: 'pair',
                                            args: [
                                              { prim: 'address' },
                                              {
                                                prim: 'pair',
                                                args: [
                                                  { prim: 'address' },
                                                  { prim: 'nat' },
                                                ],
                                              },
                                            ],
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    prim: 'pair',
                    args: [
                      {
                        prim: 'pair',
                        args: [
                          {
                            prim: 'pair',
                            args: [{ prim: 'address' }, { prim: 'nat' }],
                          },
                          {
                            prim: 'pair',
                            args: [
                              {
                                prim: 'big_map',
                                args: [
                                  {
                                    prim: 'pair',
                                    args: [
                                      { prim: 'address' },
                                      { prim: 'nat' },
                                    ],
                                  },
                                  { prim: 'nat' },
                                ],
                              },
                              {
                                prim: 'big_map',
                                args: [{ prim: 'string' }, { prim: 'bytes' }],
                              },
                            ],
                          },
                        ],
                      },
                      {
                        prim: 'pair',
                        args: [
                          {
                            prim: 'pair',
                            args: [
                              {
                                prim: 'big_map',
                                args: [
                                  {
                                    prim: 'pair',
                                    args: [
                                      { prim: 'address' },
                                      {
                                        prim: 'pair',
                                        args: [
                                          { prim: 'address' },
                                          { prim: 'nat' },
                                        ],
                                      },
                                    ],
                                  },
                                  { prim: 'unit' },
                                ],
                              },
                              { prim: 'bool' },
                            ],
                          },
                          {
                            prim: 'pair',
                            args: [
                              {
                                prim: 'big_map',
                                args: [
                                  { prim: 'nat' },
                                  {
                                    prim: 'pair',
                                    args: [
                                      { prim: 'nat' },
                                      {
                                        prim: 'map',
                                        args: [
                                          { prim: 'string' },
                                          { prim: 'bytes' },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                              {
                                prim: 'big_map',
                                args: [{ prim: 'nat' }, { prim: 'nat' }],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          { prim: 'UNPAIR' },
          {
            prim: 'IF_LEFT',
            args: [
              [
                {
                  prim: 'IF_LEFT',
                  args: [
                    [
                      {
                        prim: 'IF_LEFT',
                        args: [
                          [
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'GET', args: [{ int: '3' }] },
                            { prim: 'CDR' },
                            {
                              prim: 'IF',
                              args: [
                                [
                                  {
                                    prim: 'PUSH',
                                    args: [
                                      { prim: 'string' },
                                      { string: 'FA2_PAUSED' },
                                    ],
                                  },
                                  { prim: 'FAILWITH' },
                                ],
                                [],
                              ],
                            },
                            { prim: 'DUP' },
                            { prim: 'CAR' },
                            {
                              prim: 'MAP',
                              args: [
                                [
                                  { prim: 'DUP', args: [{ int: '3' }] },
                                  { prim: 'GET', args: [{ int: '5' }] },
                                  { prim: 'SWAP' },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '2' }] },
                                  { prim: 'CDR' },
                                  { prim: 'MEM' },
                                  {
                                    prim: 'IF',
                                    args: [
                                      [],
                                      [
                                        {
                                          prim: 'PUSH',
                                          args: [
                                            { prim: 'string' },
                                            { string: 'FA2_TOKEN_UNDEFINED' },
                                          ],
                                        },
                                        { prim: 'FAILWITH' },
                                      ],
                                    ],
                                  },
                                  { prim: 'DUP', args: [{ int: '3' }] },
                                  { prim: 'CAR' },
                                  { prim: 'GET', args: [{ int: '3' }] },
                                  { prim: 'SWAP' },
                                  { prim: 'DUP' },
                                  { prim: 'CDR' },
                                  { prim: 'SWAP' },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '3' }] },
                                  { prim: 'CAR' },
                                  { prim: 'PAIR' },
                                  { prim: 'MEM' },
                                  {
                                    prim: 'IF',
                                    args: [
                                      [
                                        { prim: 'DUP', args: [{ int: '3' }] },
                                        { prim: 'CAR' },
                                        { prim: 'GET', args: [{ int: '3' }] },
                                        { prim: 'SWAP' },
                                        { prim: 'DUP' },
                                        { prim: 'CDR' },
                                        { prim: 'SWAP' },
                                        { prim: 'DUP' },
                                        { prim: 'DUG', args: [{ int: '3' }] },
                                        { prim: 'CAR' },
                                        { prim: 'PAIR' },
                                        { prim: 'GET' },
                                        {
                                          prim: 'IF_NONE',
                                          args: [
                                            [
                                              {
                                                prim: 'PUSH',
                                                args: [
                                                  { prim: 'int' },
                                                  { int: '425' },
                                                ],
                                              },
                                              { prim: 'FAILWITH' },
                                            ],
                                            [],
                                          ],
                                        },
                                        { prim: 'SWAP' },
                                        { prim: 'PAIR' },
                                      ],
                                      [
                                        {
                                          prim: 'PUSH',
                                          args: [{ prim: 'nat' }, { int: '0' }],
                                        },
                                        { prim: 'SWAP' },
                                        { prim: 'PAIR' },
                                      ],
                                    ],
                                  },
                                ],
                              ],
                            },
                            { prim: 'NIL', args: [{ prim: 'operation' }] },
                            { prim: 'DIG', args: [{ int: '2' }] },
                            { prim: 'CDR' },
                            {
                              prim: 'PUSH',
                              args: [{ prim: 'mutez' }, { int: '0' }],
                            },
                            { prim: 'DIG', args: [{ int: '3' }] },
                            { prim: 'TRANSFER_TOKENS' },
                            { prim: 'CONS' },
                          ],
                          [
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'SENDER' },
                            { prim: 'COMPARE' },
                            { prim: 'EQ' },
                            {
                              prim: 'IF',
                              args: [
                                [],
                                [
                                  {
                                    prim: 'PUSH',
                                    args: [
                                      { prim: 'string' },
                                      { string: 'FA2_NOT_ADMIN' },
                                    ],
                                  },
                                  { prim: 'FAILWITH' },
                                ],
                              ],
                            },
                            { prim: 'DUP' },
                            { prim: 'GET', args: [{ int: '3' }] },
                            { prim: 'DUP', args: [{ int: '3' }] },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'CDR' },
                            { prim: 'COMPARE' },
                            { prim: 'EQ' },
                            {
                              prim: 'IF',
                              args: [
                                [],
                                [
                                  {
                                    prim: 'PUSH',
                                    args: [
                                      { prim: 'string' },
                                      {
                                        string:
                                          'The first token_id has to respect the consecutiveness',
                                      },
                                    ],
                                  },
                                  { prim: 'FAILWITH' },
                                ],
                              ],
                            },
                            { prim: 'DUP' },
                            { prim: 'GET', args: [{ int: '4' }] },
                            {
                              prim: 'ITER',
                              args: [
                                [
                                  { prim: 'DUP', args: [{ int: '3' }] },
                                  { prim: 'UNPAIR' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'SWAP' },
                                  { prim: 'UNPAIR' },
                                  {
                                    prim: 'PUSH',
                                    args: [
                                      {
                                        prim: 'option',
                                        args: [{ prim: 'nat' }],
                                      },
                                      { prim: 'Some', args: [{ int: '1' }] },
                                    ],
                                  },
                                  { prim: 'DIG', args: [{ int: '7' }] },
                                  { prim: 'CAR' },
                                  { prim: 'CAR' },
                                  { prim: 'CDR' },
                                  { prim: 'DUP', args: [{ int: '8' }] },
                                  { prim: 'CAR' },
                                  { prim: 'PAIR' },
                                  { prim: 'UPDATE' },
                                  { prim: 'PAIR' },
                                  { prim: 'SWAP' },
                                  { prim: 'PAIR' },
                                  { prim: 'PAIR' },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '3' }] },
                                  { prim: 'DUP' },
                                  { prim: 'GET', args: [{ int: '5' }] },
                                  {
                                    prim: 'EMPTY_MAP',
                                    args: [
                                      { prim: 'string' },
                                      { prim: 'bytes' },
                                    ],
                                  },
                                  { prim: 'DIG', args: [{ int: '3' }] },
                                  { prim: 'SOME' },
                                  {
                                    prim: 'PUSH',
                                    args: [{ prim: 'string' }, { string: '' }],
                                  },
                                  { prim: 'UPDATE' },
                                  { prim: 'DUP', args: [{ int: '5' }] },
                                  { prim: 'CAR' },
                                  { prim: 'CAR' },
                                  { prim: 'CDR' },
                                  { prim: 'PAIR' },
                                  { prim: 'SOME' },
                                  { prim: 'DIG', args: [{ int: '4' }] },
                                  { prim: 'CAR' },
                                  { prim: 'CAR' },
                                  { prim: 'CDR' },
                                  { prim: 'UPDATE' },
                                  { prim: 'UPDATE', args: [{ int: '5' }] },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '2' }] },
                                  { prim: 'DUP' },
                                  { prim: 'GET', args: [{ int: '6' }] },
                                  {
                                    prim: 'PUSH',
                                    args: [
                                      {
                                        prim: 'option',
                                        args: [{ prim: 'nat' }],
                                      },
                                      { prim: 'Some', args: [{ int: '1' }] },
                                    ],
                                  },
                                  { prim: 'DIG', args: [{ int: '4' }] },
                                  { prim: 'CAR' },
                                  { prim: 'CAR' },
                                  { prim: 'CDR' },
                                  { prim: 'UPDATE' },
                                  { prim: 'UPDATE', args: [{ int: '6' }] },
                                  { prim: 'DUP' },
                                  { prim: 'CAR' },
                                  { prim: 'CAR' },
                                  { prim: 'CDR' },
                                  { prim: 'SWAP' },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '3' }] },
                                  { prim: 'CAR' },
                                  { prim: 'CAR' },
                                  { prim: 'CDR' },
                                  { prim: 'COMPARE' },
                                  { prim: 'EQ' },
                                  {
                                    prim: 'IF',
                                    args: [
                                      [],
                                      [
                                        {
                                          prim: 'PUSH',
                                          args: [
                                            { prim: 'string' },
                                            {
                                              string:
                                                'Token-IDs should be consecutive',
                                            },
                                          ],
                                        },
                                        { prim: 'FAILWITH' },
                                      ],
                                    ],
                                  },
                                  { prim: 'SWAP' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'SWAP' },
                                  {
                                    prim: 'PUSH',
                                    args: [{ prim: 'nat' }, { int: '1' }],
                                  },
                                  { prim: 'ADD' },
                                  { prim: 'SWAP' },
                                  { prim: 'PAIR' },
                                  { prim: 'PAIR' },
                                  { prim: 'PAIR' },
                                  { prim: 'SWAP' },
                                ],
                              ],
                            },
                            { prim: 'DROP' },
                            { prim: 'NIL', args: [{ prim: 'operation' }] },
                          ],
                        ],
                      },
                    ],
                    [
                      {
                        prim: 'IF_LEFT',
                        args: [
                          [
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'SENDER' },
                            { prim: 'COMPARE' },
                            { prim: 'EQ' },
                            {
                              prim: 'IF',
                              args: [
                                [],
                                [
                                  {
                                    prim: 'PUSH',
                                    args: [
                                      { prim: 'string' },
                                      { string: 'FA2_NOT_ADMIN' },
                                    ],
                                  },
                                  { prim: 'FAILWITH' },
                                ],
                              ],
                            },
                            { prim: 'DUP' },
                            {
                              prim: 'ITER',
                              args: [
                                [
                                  { prim: 'DUP', args: [{ int: '3' }] },
                                  { prim: 'GET', args: [{ int: '5' }] },
                                  { prim: 'SWAP' },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '2' }] },
                                  { prim: 'CDR' },
                                  { prim: 'MEM' },
                                  {
                                    prim: 'IF',
                                    args: [
                                      [],
                                      [
                                        {
                                          prim: 'PUSH',
                                          args: [
                                            { prim: 'string' },
                                            { string: 'FA2_TOKEN_UNDEFINED' },
                                          ],
                                        },
                                        { prim: 'FAILWITH' },
                                      ],
                                    ],
                                  },
                                  {
                                    prim: 'PUSH',
                                    args: [{ prim: 'nat' }, { int: '1' }],
                                  },
                                  { prim: 'DUP', args: [{ int: '4' }] },
                                  { prim: 'CAR' },
                                  { prim: 'GET', args: [{ int: '3' }] },
                                  { prim: 'DIG', args: [{ int: '2' }] },
                                  { prim: 'DUP' },
                                  { prim: 'CDR' },
                                  { prim: 'SWAP' },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '4' }] },
                                  { prim: 'CAR' },
                                  { prim: 'PAIR' },
                                  { prim: 'GET' },
                                  {
                                    prim: 'IF_NONE',
                                    args: [
                                      [
                                        {
                                          prim: 'PUSH',
                                          args: [
                                            { prim: 'int' },
                                            { int: '734' },
                                          ],
                                        },
                                        { prim: 'FAILWITH' },
                                      ],
                                      [],
                                    ],
                                  },
                                  { prim: 'COMPARE' },
                                  { prim: 'EQ' },
                                  {
                                    prim: 'IF',
                                    args: [
                                      [],
                                      [
                                        {
                                          prim: 'PUSH',
                                          args: [
                                            { prim: 'string' },
                                            { string: 'WRONG_NFT_OWNER' },
                                          ],
                                        },
                                        { prim: 'FAILWITH' },
                                      ],
                                    ],
                                  },
                                  { prim: 'DIG', args: [{ int: '2' }] },
                                  { prim: 'UNPAIR' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'SWAP' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'NONE', args: [{ prim: 'nat' }] },
                                  { prim: 'DIG', args: [{ int: '5' }] },
                                  { prim: 'DUP' },
                                  { prim: 'CDR' },
                                  { prim: 'SWAP' },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '7' }] },
                                  { prim: 'CAR' },
                                  { prim: 'PAIR' },
                                  { prim: 'UPDATE' },
                                  { prim: 'PAIR' },
                                  { prim: 'SWAP' },
                                  { prim: 'PAIR' },
                                  { prim: 'PAIR' },
                                  { prim: 'DUP' },
                                  { prim: 'GET', args: [{ int: '5' }] },
                                  {
                                    prim: 'NONE',
                                    args: [
                                      {
                                        prim: 'pair',
                                        args: [
                                          { prim: 'nat' },
                                          {
                                            prim: 'map',
                                            args: [
                                              { prim: 'string' },
                                              { prim: 'bytes' },
                                            ],
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                  { prim: 'DUP', args: [{ int: '4' }] },
                                  { prim: 'CDR' },
                                  { prim: 'UPDATE' },
                                  { prim: 'UPDATE', args: [{ int: '5' }] },
                                  { prim: 'DUP' },
                                  { prim: 'GET', args: [{ int: '6' }] },
                                  { prim: 'NONE', args: [{ prim: 'nat' }] },
                                  { prim: 'DIG', args: [{ int: '3' }] },
                                  { prim: 'CDR' },
                                  { prim: 'UPDATE' },
                                  { prim: 'UPDATE', args: [{ int: '6' }] },
                                  { prim: 'SWAP' },
                                ],
                              ],
                            },
                            { prim: 'DROP' },
                          ],
                          [
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'SENDER' },
                            { prim: 'COMPARE' },
                            { prim: 'EQ' },
                            {
                              prim: 'IF',
                              args: [
                                [],
                                [
                                  {
                                    prim: 'PUSH',
                                    args: [
                                      { prim: 'string' },
                                      { string: 'FA2_NOT_ADMIN' },
                                    ],
                                  },
                                  { prim: 'FAILWITH' },
                                ],
                              ],
                            },
                            { prim: 'DUP' },
                            { prim: 'CAR' },
                            { prim: 'CDR' },
                            {
                              prim: 'PUSH',
                              args: [{ prim: 'nat' }, { int: '1' }],
                            },
                            { prim: 'COMPARE' },
                            { prim: 'EQ' },
                            {
                              prim: 'IF',
                              args: [
                                [],
                                [
                                  {
                                    prim: 'PUSH',
                                    args: [
                                      { prim: 'string' },
                                      { string: 'NFT-asset: amount <> 1' },
                                    ],
                                  },
                                  { prim: 'FAILWITH' },
                                ],
                              ],
                            },
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'CDR' },
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'GET', args: [{ int: '4' }] },
                            { prim: 'COMPARE' },
                            { prim: 'LT' },
                            {
                              prim: 'IF',
                              args: [
                                [
                                  {
                                    prim: 'PUSH',
                                    args: [
                                      { prim: 'string' },
                                      {
                                        string:
                                          'NFT-asset: cannot mint twice same token',
                                      },
                                    ],
                                  },
                                  { prim: 'FAILWITH' },
                                ],
                                [],
                              ],
                            },
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'CAR' },
                            { prim: 'GET', args: [{ int: '3' }] },
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'GET', args: [{ int: '4' }] },
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '3' }] },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'PAIR' },
                            { prim: 'MEM' },
                            {
                              prim: 'IF',
                              args: [
                                [
                                  { prim: 'SWAP' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'SWAP' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'DUP' },
                                  { prim: 'DIG', args: [{ int: '5' }] },
                                  { prim: 'DUP' },
                                  { prim: 'GET', args: [{ int: '4' }] },
                                  { prim: 'SWAP' },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '7' }] },
                                  { prim: 'CAR' },
                                  { prim: 'CAR' },
                                  { prim: 'PAIR' },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '2' }] },
                                  { prim: 'GET' },
                                  {
                                    prim: 'IF_NONE',
                                    args: [
                                      [
                                        {
                                          prim: 'PUSH',
                                          args: [
                                            { prim: 'int' },
                                            { int: '535' },
                                          ],
                                        },
                                        { prim: 'FAILWITH' },
                                      ],
                                      [],
                                    ],
                                  },
                                  { prim: 'DUP', args: [{ int: '7' }] },
                                  { prim: 'CAR' },
                                  { prim: 'CDR' },
                                  { prim: 'ADD' },
                                  { prim: 'SOME' },
                                  { prim: 'SWAP' },
                                  { prim: 'UPDATE' },
                                  { prim: 'PAIR' },
                                  { prim: 'SWAP' },
                                  { prim: 'PAIR' },
                                  { prim: 'PAIR' },
                                  { prim: 'SWAP' },
                                ],
                                [
                                  { prim: 'SWAP' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'SWAP' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'DUP', args: [{ int: '5' }] },
                                  { prim: 'CAR' },
                                  { prim: 'CDR' },
                                  { prim: 'SOME' },
                                  { prim: 'DIG', args: [{ int: '5' }] },
                                  { prim: 'DUP' },
                                  { prim: 'GET', args: [{ int: '4' }] },
                                  { prim: 'SWAP' },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '7' }] },
                                  { prim: 'CAR' },
                                  { prim: 'CAR' },
                                  { prim: 'PAIR' },
                                  { prim: 'UPDATE' },
                                  { prim: 'PAIR' },
                                  { prim: 'SWAP' },
                                  { prim: 'PAIR' },
                                  { prim: 'PAIR' },
                                  { prim: 'SWAP' },
                                ],
                              ],
                            },
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'CDR' },
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'GET', args: [{ int: '4' }] },
                            { prim: 'COMPARE' },
                            { prim: 'LT' },
                            {
                              prim: 'IF',
                              args: [
                                [],
                                [
                                  { prim: 'DUP' },
                                  { prim: 'GET', args: [{ int: '4' }] },
                                  { prim: 'DUP', args: [{ int: '3' }] },
                                  { prim: 'CAR' },
                                  { prim: 'CAR' },
                                  { prim: 'CDR' },
                                  { prim: 'COMPARE' },
                                  { prim: 'EQ' },
                                  {
                                    prim: 'IF',
                                    args: [
                                      [],
                                      [
                                        {
                                          prim: 'PUSH',
                                          args: [
                                            { prim: 'string' },
                                            {
                                              string:
                                                'Token-IDs should be consecutive',
                                            },
                                          ],
                                        },
                                        { prim: 'FAILWITH' },
                                      ],
                                    ],
                                  },
                                  { prim: 'SWAP' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'UNPAIR' },
                                  { prim: 'CAR' },
                                  {
                                    prim: 'PUSH',
                                    args: [{ prim: 'nat' }, { int: '1' }],
                                  },
                                  { prim: 'DUP', args: [{ int: '5' }] },
                                  { prim: 'GET', args: [{ int: '4' }] },
                                  { prim: 'ADD' },
                                  { prim: 'SWAP' },
                                  { prim: 'PAIR' },
                                  { prim: 'PAIR' },
                                  { prim: 'PAIR' },
                                  { prim: 'DUP' },
                                  { prim: 'GET', args: [{ int: '5' }] },
                                  { prim: 'DIG', args: [{ int: '2' }] },
                                  { prim: 'DUP' },
                                  { prim: 'GET', args: [{ int: '3' }] },
                                  { prim: 'SWAP' },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '4' }] },
                                  { prim: 'GET', args: [{ int: '4' }] },
                                  { prim: 'PAIR' },
                                  { prim: 'SOME' },
                                  { prim: 'DUP', args: [{ int: '4' }] },
                                  { prim: 'GET', args: [{ int: '4' }] },
                                  { prim: 'UPDATE' },
                                  { prim: 'UPDATE', args: [{ int: '5' }] },
                                  { prim: 'SWAP' },
                                ],
                              ],
                            },
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'DUP' },
                            { prim: 'GET', args: [{ int: '6' }] },
                            { prim: 'DIG', args: [{ int: '3' }] },
                            { prim: 'GET', args: [{ int: '6' }] },
                            { prim: 'DUP', args: [{ int: '4' }] },
                            { prim: 'GET', args: [{ int: '4' }] },
                            { prim: 'GET' },
                            {
                              prim: 'IF_NONE',
                              args: [
                                [
                                  {
                                    prim: 'PUSH',
                                    args: [{ prim: 'nat' }, { int: '0' }],
                                  },
                                ],
                                [],
                              ],
                            },
                            { prim: 'DUP', args: [{ int: '4' }] },
                            { prim: 'CAR' },
                            { prim: 'CDR' },
                            { prim: 'ADD' },
                            { prim: 'SOME' },
                            { prim: 'DIG', args: [{ int: '3' }] },
                            { prim: 'GET', args: [{ int: '4' }] },
                            { prim: 'UPDATE' },
                            { prim: 'UPDATE', args: [{ int: '6' }] },
                          ],
                        ],
                      },
                      { prim: 'NIL', args: [{ prim: 'operation' }] },
                    ],
                  ],
                },
              ],
              [
                {
                  prim: 'IF_LEFT',
                  args: [
                    [
                      {
                        prim: 'IF_LEFT',
                        args: [
                          [
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'SENDER' },
                            { prim: 'COMPARE' },
                            { prim: 'EQ' },
                            {
                              prim: 'IF',
                              args: [
                                [],
                                [
                                  {
                                    prim: 'PUSH',
                                    args: [
                                      { prim: 'string' },
                                      { string: 'FA2_NOT_ADMIN' },
                                    ],
                                  },
                                  { prim: 'FAILWITH' },
                                ],
                              ],
                            },
                            { prim: 'SWAP' },
                            { prim: 'UNPAIR' },
                            { prim: 'UNPAIR' },
                            { prim: 'CDR' },
                            { prim: 'DIG', args: [{ int: '3' }] },
                            { prim: 'PAIR' },
                            { prim: 'PAIR' },
                            { prim: 'PAIR' },
                          ],
                          [
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'SENDER' },
                            { prim: 'COMPARE' },
                            { prim: 'EQ' },
                            {
                              prim: 'IF',
                              args: [
                                [],
                                [
                                  {
                                    prim: 'PUSH',
                                    args: [
                                      { prim: 'string' },
                                      { string: 'FA2_NOT_ADMIN' },
                                    ],
                                  },
                                  { prim: 'FAILWITH' },
                                ],
                              ],
                            },
                            { prim: 'SWAP' },
                            { prim: 'UNPAIR' },
                            { prim: 'UNPAIR' },
                            { prim: 'SWAP' },
                            { prim: 'UNPAIR' },
                            { prim: 'SWAP' },
                            { prim: 'DUP', args: [{ int: '5' }] },
                            { prim: 'CDR' },
                            { prim: 'SOME' },
                            { prim: 'DIG', args: [{ int: '5' }] },
                            { prim: 'CAR' },
                            { prim: 'UPDATE' },
                            { prim: 'SWAP' },
                            { prim: 'PAIR' },
                            { prim: 'SWAP' },
                            { prim: 'PAIR' },
                            { prim: 'PAIR' },
                          ],
                        ],
                      },
                    ],
                    [
                      {
                        prim: 'IF_LEFT',
                        args: [
                          [
                            { prim: 'SWAP' },
                            { prim: 'DUP' },
                            { prim: 'DUG', args: [{ int: '2' }] },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'CAR' },
                            { prim: 'SENDER' },
                            { prim: 'COMPARE' },
                            { prim: 'EQ' },
                            {
                              prim: 'IF',
                              args: [
                                [],
                                [
                                  {
                                    prim: 'PUSH',
                                    args: [
                                      { prim: 'string' },
                                      { string: 'FA2_NOT_ADMIN' },
                                    ],
                                  },
                                  { prim: 'FAILWITH' },
                                ],
                              ],
                            },
                            { prim: 'SWAP' },
                            { prim: 'UNPAIR' },
                            { prim: 'SWAP' },
                            { prim: 'UNPAIR' },
                            { prim: 'CAR' },
                            { prim: 'DIG', args: [{ int: '3' }] },
                            { prim: 'SWAP' },
                            { prim: 'PAIR' },
                            { prim: 'PAIR' },
                            { prim: 'SWAP' },
                            { prim: 'PAIR' },
                          ],
                          [
                            {
                              prim: 'IF_LEFT',
                              args: [
                                [
                                  { prim: 'SWAP' },
                                  { prim: 'DUP' },
                                  { prim: 'DUG', args: [{ int: '2' }] },
                                  { prim: 'GET', args: [{ int: '3' }] },
                                  { prim: 'CDR' },
                                  {
                                    prim: 'IF',
                                    args: [
                                      [
                                        {
                                          prim: 'PUSH',
                                          args: [
                                            { prim: 'string' },
                                            { string: 'FA2_PAUSED' },
                                          ],
                                        },
                                        { prim: 'FAILWITH' },
                                      ],
                                      [],
                                    ],
                                  },
                                  { prim: 'DUP' },
                                  {
                                    prim: 'ITER',
                                    args: [
                                      [
                                        { prim: 'DUP' },
                                        { prim: 'CDR' },
                                        {
                                          prim: 'ITER',
                                          args: [
                                            [
                                              {
                                                prim: 'DUP',
                                                args: [{ int: '4' }],
                                              },
                                              { prim: 'CAR' },
                                              { prim: 'CAR' },
                                              { prim: 'CAR' },
                                              { prim: 'SENDER' },
                                              { prim: 'COMPARE' },
                                              { prim: 'EQ' },
                                              {
                                                prim: 'IF',
                                                args: [
                                                  [
                                                    {
                                                      prim: 'PUSH',
                                                      args: [
                                                        { prim: 'bool' },
                                                        { prim: 'True' },
                                                      ],
                                                    },
                                                  ],
                                                  [
                                                    { prim: 'SENDER' },
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '3' }],
                                                    },
                                                    { prim: 'CAR' },
                                                    { prim: 'COMPARE' },
                                                    { prim: 'EQ' },
                                                  ],
                                                ],
                                              },
                                              {
                                                prim: 'IF',
                                                args: [
                                                  [
                                                    {
                                                      prim: 'PUSH',
                                                      args: [
                                                        { prim: 'bool' },
                                                        { prim: 'True' },
                                                      ],
                                                    },
                                                  ],
                                                  [
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '4' }],
                                                    },
                                                    {
                                                      prim: 'GET',
                                                      args: [{ int: '3' }],
                                                    },
                                                    { prim: 'CAR' },
                                                    { prim: 'SWAP' },
                                                    { prim: 'DUP' },
                                                    {
                                                      prim: 'DUG',
                                                      args: [{ int: '2' }],
                                                    },
                                                    {
                                                      prim: 'GET',
                                                      args: [{ int: '3' }],
                                                    },
                                                    { prim: 'SENDER' },
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '5' }],
                                                    },
                                                    { prim: 'CAR' },
                                                    {
                                                      prim: 'PAIR',
                                                      args: [{ int: '3' }],
                                                    },
                                                    { prim: 'MEM' },
                                                  ],
                                                ],
                                              },
                                              {
                                                prim: 'IF',
                                                args: [
                                                  [],
                                                  [
                                                    {
                                                      prim: 'PUSH',
                                                      args: [
                                                        { prim: 'string' },
                                                        {
                                                          string:
                                                            'FA2_NOT_OPERATOR',
                                                        },
                                                      ],
                                                    },
                                                    { prim: 'FAILWITH' },
                                                  ],
                                                ],
                                              },
                                              {
                                                prim: 'DUP',
                                                args: [{ int: '4' }],
                                              },
                                              {
                                                prim: 'GET',
                                                args: [{ int: '5' }],
                                              },
                                              { prim: 'SWAP' },
                                              { prim: 'DUP' },
                                              {
                                                prim: 'DUG',
                                                args: [{ int: '2' }],
                                              },
                                              {
                                                prim: 'GET',
                                                args: [{ int: '3' }],
                                              },
                                              { prim: 'MEM' },
                                              {
                                                prim: 'IF',
                                                args: [
                                                  [],
                                                  [
                                                    {
                                                      prim: 'PUSH',
                                                      args: [
                                                        { prim: 'string' },
                                                        {
                                                          string:
                                                            'FA2_TOKEN_UNDEFINED',
                                                        },
                                                      ],
                                                    },
                                                    { prim: 'FAILWITH' },
                                                  ],
                                                ],
                                              },
                                              { prim: 'DUP' },
                                              {
                                                prim: 'GET',
                                                args: [{ int: '4' }],
                                              },
                                              {
                                                prim: 'PUSH',
                                                args: [
                                                  { prim: 'nat' },
                                                  { int: '0' },
                                                ],
                                              },
                                              { prim: 'COMPARE' },
                                              { prim: 'LT' },
                                              {
                                                prim: 'IF',
                                                args: [
                                                  [
                                                    { prim: 'DUP' },
                                                    {
                                                      prim: 'GET',
                                                      args: [{ int: '4' }],
                                                    },
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '5' }],
                                                    },
                                                    { prim: 'CAR' },
                                                    {
                                                      prim: 'GET',
                                                      args: [{ int: '3' }],
                                                    },
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '3' }],
                                                    },
                                                    {
                                                      prim: 'GET',
                                                      args: [{ int: '3' }],
                                                    },
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '5' }],
                                                    },
                                                    { prim: 'CAR' },
                                                    { prim: 'PAIR' },
                                                    { prim: 'GET' },
                                                    {
                                                      prim: 'IF_NONE',
                                                      args: [
                                                        [
                                                          {
                                                            prim: 'PUSH',
                                                            args: [
                                                              { prim: 'int' },
                                                              { int: '404' },
                                                            ],
                                                          },
                                                          { prim: 'FAILWITH' },
                                                        ],
                                                        [],
                                                      ],
                                                    },
                                                    { prim: 'COMPARE' },
                                                    { prim: 'GE' },
                                                    {
                                                      prim: 'IF',
                                                      args: [
                                                        [],
                                                        [
                                                          {
                                                            prim: 'PUSH',
                                                            args: [
                                                              {
                                                                prim: 'string',
                                                              },
                                                              {
                                                                string:
                                                                  'FA2_INSUFFICIENT_BALANCE',
                                                              },
                                                            ],
                                                          },
                                                          { prim: 'FAILWITH' },
                                                        ],
                                                      ],
                                                    },
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '4' }],
                                                    },
                                                    { prim: 'UNPAIR' },
                                                    { prim: 'UNPAIR' },
                                                    { prim: 'SWAP' },
                                                    { prim: 'UNPAIR' },
                                                    { prim: 'DUP' },
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '6' }],
                                                    },
                                                    {
                                                      prim: 'GET',
                                                      args: [{ int: '3' }],
                                                    },
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '8' }],
                                                    },
                                                    { prim: 'CAR' },
                                                    { prim: 'PAIR' },
                                                    { prim: 'DUP' },
                                                    {
                                                      prim: 'DUG',
                                                      args: [{ int: '2' }],
                                                    },
                                                    { prim: 'GET' },
                                                    {
                                                      prim: 'IF_NONE',
                                                      args: [
                                                        [
                                                          {
                                                            prim: 'PUSH',
                                                            args: [
                                                              { prim: 'int' },
                                                              { int: '407' },
                                                            ],
                                                          },
                                                          { prim: 'FAILWITH' },
                                                        ],
                                                        [{ prim: 'DROP' }],
                                                      ],
                                                    },
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '6' }],
                                                    },
                                                    {
                                                      prim: 'GET',
                                                      args: [{ int: '4' }],
                                                    },
                                                    {
                                                      prim: 'DIG',
                                                      args: [{ int: '9' }],
                                                    },
                                                    { prim: 'CAR' },
                                                    {
                                                      prim: 'GET',
                                                      args: [{ int: '3' }],
                                                    },
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '8' }],
                                                    },
                                                    {
                                                      prim: 'GET',
                                                      args: [{ int: '3' }],
                                                    },
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '10' }],
                                                    },
                                                    { prim: 'CAR' },
                                                    { prim: 'PAIR' },
                                                    { prim: 'GET' },
                                                    {
                                                      prim: 'IF_NONE',
                                                      args: [
                                                        [
                                                          {
                                                            prim: 'PUSH',
                                                            args: [
                                                              { prim: 'int' },
                                                              { int: '408' },
                                                            ],
                                                          },
                                                          { prim: 'FAILWITH' },
                                                        ],
                                                        [],
                                                      ],
                                                    },
                                                    { prim: 'SUB' },
                                                    { prim: 'ISNAT' },
                                                    {
                                                      prim: 'IF_NONE',
                                                      args: [
                                                        [
                                                          {
                                                            prim: 'PUSH',
                                                            args: [
                                                              { prim: 'int' },
                                                              { int: '407' },
                                                            ],
                                                          },
                                                          { prim: 'FAILWITH' },
                                                        ],
                                                        [],
                                                      ],
                                                    },
                                                    { prim: 'SOME' },
                                                    { prim: 'SWAP' },
                                                    { prim: 'UPDATE' },
                                                    { prim: 'PAIR' },
                                                    { prim: 'SWAP' },
                                                    { prim: 'PAIR' },
                                                    { prim: 'PAIR' },
                                                    { prim: 'DUP' },
                                                    {
                                                      prim: 'DUG',
                                                      args: [{ int: '4' }],
                                                    },
                                                    { prim: 'CAR' },
                                                    {
                                                      prim: 'GET',
                                                      args: [{ int: '3' }],
                                                    },
                                                    { prim: 'SWAP' },
                                                    { prim: 'DUP' },
                                                    {
                                                      prim: 'GET',
                                                      args: [{ int: '3' }],
                                                    },
                                                    { prim: 'SWAP' },
                                                    { prim: 'DUP' },
                                                    {
                                                      prim: 'DUG',
                                                      args: [{ int: '3' }],
                                                    },
                                                    { prim: 'CAR' },
                                                    { prim: 'PAIR' },
                                                    { prim: 'MEM' },
                                                    {
                                                      prim: 'IF',
                                                      args: [
                                                        [
                                                          {
                                                            prim: 'DIG',
                                                            args: [
                                                              { int: '3' },
                                                            ],
                                                          },
                                                          { prim: 'UNPAIR' },
                                                          { prim: 'UNPAIR' },
                                                          { prim: 'SWAP' },
                                                          { prim: 'UNPAIR' },
                                                          { prim: 'DUP' },
                                                          {
                                                            prim: 'DIG',
                                                            args: [
                                                              { int: '5' },
                                                            ],
                                                          },
                                                          { prim: 'DUP' },
                                                          {
                                                            prim: 'GET',
                                                            args: [
                                                              { int: '3' },
                                                            ],
                                                          },
                                                          { prim: 'SWAP' },
                                                          { prim: 'DUP' },
                                                          {
                                                            prim: 'DUG',
                                                            args: [
                                                              { int: '7' },
                                                            ],
                                                          },
                                                          { prim: 'CAR' },
                                                          { prim: 'PAIR' },
                                                          { prim: 'DUP' },
                                                          {
                                                            prim: 'DUG',
                                                            args: [
                                                              { int: '2' },
                                                            ],
                                                          },
                                                          { prim: 'GET' },
                                                          {
                                                            prim: 'IF_NONE',
                                                            args: [
                                                              [
                                                                {
                                                                  prim: 'PUSH',
                                                                  args: [
                                                                    {
                                                                      prim: 'int',
                                                                    },
                                                                    {
                                                                      int: '410',
                                                                    },
                                                                  ],
                                                                },
                                                                {
                                                                  prim: 'FAILWITH',
                                                                },
                                                              ],
                                                              [],
                                                            ],
                                                          },
                                                          {
                                                            prim: 'DIG',
                                                            args: [
                                                              { int: '6' },
                                                            ],
                                                          },
                                                          {
                                                            prim: 'GET',
                                                            args: [
                                                              { int: '4' },
                                                            ],
                                                          },
                                                          { prim: 'ADD' },
                                                          { prim: 'SOME' },
                                                          { prim: 'SWAP' },
                                                          { prim: 'UPDATE' },
                                                          { prim: 'PAIR' },
                                                          { prim: 'SWAP' },
                                                          { prim: 'PAIR' },
                                                          { prim: 'PAIR' },
                                                          {
                                                            prim: 'DUG',
                                                            args: [
                                                              { int: '2' },
                                                            ],
                                                          },
                                                        ],
                                                        [
                                                          {
                                                            prim: 'DIG',
                                                            args: [
                                                              { int: '3' },
                                                            ],
                                                          },
                                                          { prim: 'UNPAIR' },
                                                          { prim: 'UNPAIR' },
                                                          { prim: 'SWAP' },
                                                          { prim: 'UNPAIR' },
                                                          {
                                                            prim: 'DUP',
                                                            args: [
                                                              { int: '5' },
                                                            ],
                                                          },
                                                          {
                                                            prim: 'GET',
                                                            args: [
                                                              { int: '4' },
                                                            ],
                                                          },
                                                          { prim: 'SOME' },
                                                          {
                                                            prim: 'DIG',
                                                            args: [
                                                              { int: '5' },
                                                            ],
                                                          },
                                                          { prim: 'DUP' },
                                                          {
                                                            prim: 'GET',
                                                            args: [
                                                              { int: '3' },
                                                            ],
                                                          },
                                                          { prim: 'SWAP' },
                                                          { prim: 'CAR' },
                                                          { prim: 'PAIR' },
                                                          { prim: 'UPDATE' },
                                                          { prim: 'PAIR' },
                                                          { prim: 'SWAP' },
                                                          { prim: 'PAIR' },
                                                          { prim: 'PAIR' },
                                                          {
                                                            prim: 'DUG',
                                                            args: [
                                                              { int: '2' },
                                                            ],
                                                          },
                                                        ],
                                                      ],
                                                    },
                                                  ],
                                                  [{ prim: 'DROP' }],
                                                ],
                                              },
                                            ],
                                          ],
                                        },
                                        { prim: 'DROP' },
                                      ],
                                    ],
                                  },
                                  { prim: 'DROP' },
                                ],
                                [
                                  { prim: 'DUP' },
                                  {
                                    prim: 'ITER',
                                    args: [
                                      [
                                        {
                                          prim: 'IF_LEFT',
                                          args: [
                                            [
                                              { prim: 'DUP' },
                                              { prim: 'CAR' },
                                              { prim: 'SENDER' },
                                              { prim: 'COMPARE' },
                                              { prim: 'EQ' },
                                              {
                                                prim: 'IF',
                                                args: [
                                                  [
                                                    {
                                                      prim: 'PUSH',
                                                      args: [
                                                        { prim: 'bool' },
                                                        { prim: 'True' },
                                                      ],
                                                    },
                                                  ],
                                                  [
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '3' }],
                                                    },
                                                    { prim: 'CAR' },
                                                    { prim: 'CAR' },
                                                    { prim: 'CAR' },
                                                    { prim: 'SENDER' },
                                                    { prim: 'COMPARE' },
                                                    { prim: 'EQ' },
                                                  ],
                                                ],
                                              },
                                              {
                                                prim: 'IF',
                                                args: [
                                                  [],
                                                  [
                                                    {
                                                      prim: 'PUSH',
                                                      args: [
                                                        { prim: 'string' },
                                                        {
                                                          string:
                                                            'FA2_NOT_ADMIN_OR_OPERATOR',
                                                        },
                                                      ],
                                                    },
                                                    { prim: 'FAILWITH' },
                                                  ],
                                                ],
                                              },
                                              {
                                                prim: 'DIG',
                                                args: [{ int: '2' }],
                                              },
                                              { prim: 'UNPAIR' },
                                              { prim: 'SWAP' },
                                              { prim: 'UNPAIR' },
                                              { prim: 'UNPAIR' },
                                              {
                                                prim: 'PUSH',
                                                args: [
                                                  {
                                                    prim: 'option',
                                                    args: [{ prim: 'unit' }],
                                                  },
                                                  {
                                                    prim: 'Some',
                                                    args: [{ prim: 'Unit' }],
                                                  },
                                                ],
                                              },
                                              {
                                                prim: 'DIG',
                                                args: [{ int: '5' }],
                                              },
                                              { prim: 'DUP' },
                                              {
                                                prim: 'GET',
                                                args: [{ int: '4' }],
                                              },
                                              { prim: 'SWAP' },
                                              { prim: 'DUP' },
                                              {
                                                prim: 'GET',
                                                args: [{ int: '3' }],
                                              },
                                              { prim: 'SWAP' },
                                              { prim: 'CAR' },
                                              {
                                                prim: 'PAIR',
                                                args: [{ int: '3' }],
                                              },
                                              { prim: 'UPDATE' },
                                              { prim: 'PAIR' },
                                              { prim: 'PAIR' },
                                              { prim: 'SWAP' },
                                              { prim: 'PAIR' },
                                              { prim: 'SWAP' },
                                            ],
                                            [
                                              { prim: 'DUP' },
                                              { prim: 'CAR' },
                                              { prim: 'SENDER' },
                                              { prim: 'COMPARE' },
                                              { prim: 'EQ' },
                                              {
                                                prim: 'IF',
                                                args: [
                                                  [
                                                    {
                                                      prim: 'PUSH',
                                                      args: [
                                                        { prim: 'bool' },
                                                        { prim: 'True' },
                                                      ],
                                                    },
                                                  ],
                                                  [
                                                    {
                                                      prim: 'DUP',
                                                      args: [{ int: '3' }],
                                                    },
                                                    { prim: 'CAR' },
                                                    { prim: 'CAR' },
                                                    { prim: 'CAR' },
                                                    { prim: 'SENDER' },
                                                    { prim: 'COMPARE' },
                                                    { prim: 'EQ' },
                                                  ],
                                                ],
                                              },
                                              {
                                                prim: 'IF',
                                                args: [
                                                  [],
                                                  [
                                                    {
                                                      prim: 'PUSH',
                                                      args: [
                                                        { prim: 'string' },
                                                        {
                                                          string:
                                                            'FA2_NOT_ADMIN_OR_OPERATOR',
                                                        },
                                                      ],
                                                    },
                                                    { prim: 'FAILWITH' },
                                                  ],
                                                ],
                                              },
                                              {
                                                prim: 'DIG',
                                                args: [{ int: '2' }],
                                              },
                                              { prim: 'UNPAIR' },
                                              { prim: 'SWAP' },
                                              { prim: 'UNPAIR' },
                                              { prim: 'UNPAIR' },
                                              {
                                                prim: 'NONE',
                                                args: [{ prim: 'unit' }],
                                              },
                                              {
                                                prim: 'DIG',
                                                args: [{ int: '5' }],
                                              },
                                              { prim: 'DUP' },
                                              {
                                                prim: 'GET',
                                                args: [{ int: '4' }],
                                              },
                                              { prim: 'SWAP' },
                                              { prim: 'DUP' },
                                              {
                                                prim: 'GET',
                                                args: [{ int: '3' }],
                                              },
                                              { prim: 'SWAP' },
                                              { prim: 'CAR' },
                                              {
                                                prim: 'PAIR',
                                                args: [{ int: '3' }],
                                              },
                                              { prim: 'UPDATE' },
                                              { prim: 'PAIR' },
                                              { prim: 'PAIR' },
                                              { prim: 'SWAP' },
                                              { prim: 'PAIR' },
                                              { prim: 'SWAP' },
                                            ],
                                          ],
                                        },
                                      ],
                                    ],
                                  },
                                  { prim: 'DROP' },
                                ],
                              ],
                            },
                          ],
                        ],
                      },
                    ],
                  ],
                },
                { prim: 'NIL', args: [{ prim: 'operation' }] },
              ],
            ],
          },
          { prim: 'PAIR' },
        ],
      ],
    },
    {
      prim: 'view',
      args: [
        { string: 'all_tokens' },
        { prim: 'unit' },
        { prim: 'list', args: [{ prim: 'nat' }] },
        [
          { prim: 'UNPAIR' },
          { prim: 'NIL', args: [{ prim: 'nat' }] },
          { prim: 'DUP', args: [{ int: '3' }] },
          { prim: 'CAR' },
          { prim: 'CAR' },
          { prim: 'CDR' },
          { prim: 'PUSH', args: [{ prim: 'nat' }, { int: '0' }] },
          { prim: 'DUP' },
          { prim: 'DUP', args: [{ int: '3' }] },
          { prim: 'COMPARE' },
          { prim: 'GT' },
          {
            prim: 'LOOP',
            args: [
              [
                { prim: 'DUP' },
                { prim: 'DIG', args: [{ int: '3' }] },
                { prim: 'SWAP' },
                { prim: 'CONS' },
                { prim: 'DUG', args: [{ int: '2' }] },
                { prim: 'PUSH', args: [{ prim: 'nat' }, { int: '1' }] },
                { prim: 'ADD' },
                { prim: 'DUP' },
                { prim: 'DUP', args: [{ int: '3' }] },
                { prim: 'COMPARE' },
                { prim: 'GT' },
              ],
            ],
          },
          { prim: 'DROP', args: [{ int: '2' }] },
          { prim: 'SWAP' },
          { prim: 'DROP' },
          { prim: 'SWAP' },
          { prim: 'DROP' },
          { prim: 'NIL', args: [{ prim: 'nat' }] },
          { prim: 'SWAP' },
          { prim: 'ITER', args: [[{ prim: 'CONS' }]] },
        ],
      ],
    },
    {
      prim: 'view',
      args: [
        { string: 'count_tokens' },
        { prim: 'unit' },
        { prim: 'nat' },
        [{ prim: 'CDR' }, { prim: 'CAR' }, { prim: 'CAR' }, { prim: 'CDR' }],
      ],
    },
    {
      prim: 'view',
      args: [
        { string: 'does_token_exist' },
        { prim: 'nat' },
        { prim: 'bool' },
        [
          { prim: 'UNPAIR' },
          { prim: 'SWAP' },
          { prim: 'GET', args: [{ int: '5' }] },
          { prim: 'SWAP' },
          { prim: 'MEM' },
        ],
      ],
    },
    {
      prim: 'view',
      args: [
        { string: 'get_balance' },
        {
          prim: 'pair',
          args: [
            { prim: 'address', annots: ['%owner'] },
            { prim: 'nat', annots: ['%token_id'] },
          ],
        },
        { prim: 'nat' },
        [
          { prim: 'UNPAIR' },
          { prim: 'SWAP' },
          { prim: 'DUP' },
          { prim: 'DUG', args: [{ int: '2' }] },
          { prim: 'GET', args: [{ int: '5' }] },
          { prim: 'SWAP' },
          { prim: 'DUP' },
          { prim: 'DUG', args: [{ int: '2' }] },
          { prim: 'CDR' },
          { prim: 'MEM' },
          {
            prim: 'IF',
            args: [
              [],
              [
                {
                  prim: 'PUSH',
                  args: [{ prim: 'string' }, { string: 'FA2_TOKEN_UNDEFINED' }],
                },
                { prim: 'FAILWITH' },
              ],
            ],
          },
          { prim: 'SWAP' },
          { prim: 'CAR' },
          { prim: 'GET', args: [{ int: '3' }] },
          { prim: 'SWAP' },
          { prim: 'GET' },
          {
            prim: 'IF_NONE',
            args: [
              [
                { prim: 'PUSH', args: [{ prim: 'int' }, { int: '791' }] },
                { prim: 'FAILWITH' },
              ],
              [],
            ],
          },
        ],
      ],
    },
    {
      prim: 'view',
      args: [
        { string: 'is_operator' },
        {
          prim: 'pair',
          args: [
            { prim: 'address', annots: ['%owner'] },
            {
              prim: 'pair',
              args: [
                { prim: 'address', annots: ['%operator'] },
                { prim: 'nat', annots: ['%token_id'] },
              ],
            },
          ],
        },
        { prim: 'bool' },
        [
          { prim: 'UNPAIR' },
          { prim: 'SWAP' },
          { prim: 'GET', args: [{ int: '3' }] },
          { prim: 'CAR' },
          { prim: 'SWAP' },
          { prim: 'DUP' },
          { prim: 'GET', args: [{ int: '4' }] },
          { prim: 'SWAP' },
          { prim: 'DUP' },
          { prim: 'GET', args: [{ int: '3' }] },
          { prim: 'SWAP' },
          { prim: 'CAR' },
          { prim: 'PAIR', args: [{ int: '3' }] },
          { prim: 'MEM' },
        ],
      ],
    },
    {
      prim: 'view',
      args: [
        { string: 'tok_metadata' },
        { prim: 'nat' },
        {
          prim: 'pair',
          args: [
            { prim: 'nat', annots: ['%token_id'] },
            {
              prim: 'map',
              args: [{ prim: 'string' }, { prim: 'bytes' }],
              annots: ['%token_info'],
            },
          ],
        },
        [
          { prim: 'UNPAIR' },
          { prim: 'SWAP' },
          { prim: 'GET', args: [{ int: '5' }] },
          { prim: 'SWAP' },
          { prim: 'GET' },
          {
            prim: 'IF_NONE',
            args: [
              [
                { prim: 'PUSH', args: [{ prim: 'int' }, { int: '797' }] },
                { prim: 'FAILWITH' },
              ],
              [],
            ],
          },
        ],
      ],
    },
    {
      prim: 'view',
      args: [
        { string: 'total_supply' },
        { prim: 'nat' },
        { prim: 'nat' },
        [
          { prim: 'UNPAIR' },
          { prim: 'SWAP' },
          { prim: 'GET', args: [{ int: '6' }] },
          { prim: 'SWAP' },
          { prim: 'GET' },
          {
            prim: 'IF_NONE',
            args: [
              [
                { prim: 'PUSH', args: [{ prim: 'int' }, { int: '765' }] },
                { prim: 'FAILWITH' },
              ],
              [],
            ],
          },
        ],
      ],
    },
  ];

  const storageJson = {
    prim: 'Pair',
    args: [
      {
        prim: 'Pair',
        args: [
          {
            prim: 'Pair',
            args: [
              { string: 'KT1AkeDxRH3Moy4NPdv5FYRDgQxMYEHEpnVr' },
              { int: '0' },
            ],
          },
          {
            prim: 'Pair',
            args: [
              [],
              [
                {
                  prim: 'Elt',
                  args: [
                    { string: '' },
                    {
                      bytes:
                        '697066733a2f2f516d594732685769756b7563326144334a3951514a4c67546a544e61724b694a674459626b4d746a423167746e58',
                    },
                  ],
                },
              ],
            ],
          },
        ],
      },
      {
        prim: 'Pair',
        args: [
          { prim: 'Pair', args: [[], { prim: 'False' }] },
          { prim: 'Pair', args: [[], []] },
        ],
      },
    ],
  };

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    webProcess.signerFactory = signerFactory;
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

  describe('#compileAndDeployContract', () => {
    it('Should return 400 when secureKeyName has unexpected value and smartContractCode is correct', async () => {
      const { body, status } = await request
        .post('/api/tezos_node/contract/deploy')
        .set('Content-Type', 'application/json')
        .send({
          secureKeyName: 'nothing',
          codeJson,
          storageJson,
        });

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: 'Error while fetching public key with the key name: nothing',
        status: 404,
      });
    });

    it('Should return 200 when secureKeyName is correct and smartContractCode is correct', async () => {
      jest.spyOn(tezosService, 'deployContract').mockResolvedValue({
        operation_hash: 'operation_hash',
        contract_address: 'contract_address',
      });
      jest.spyOn(signerFactory, 'generateSigner').mockReturnValue(fakeSigner);

      const { body, status } = await request
        .post('/api/tezos_node/contract/deploy')
        .set('Content-Type', 'application/json')
        .send({
          secureKeyName: 'admin',
          codeJson,
          storageJson,
        });

      expect(status).toEqual(201);
      expect(body).toEqual({
        operation_hash: 'operation_hash',
        contract_address: 'contract_address',
      });
    });

    it('Should return 200 when secureKeyName is correct and smartContractCode is correct and storage object is set', async () => {
      jest.spyOn(tezosService, 'deployContract').mockResolvedValue({
        operation_hash: 'operation_hash',
        contract_address: 'contract_address',
      });
      jest.spyOn(signerFactory, 'generateSigner').mockReturnValue(fakeSigner);

      const { body, status } = await request
        .post('/api/tezos_node/contract/deploy')
        .set('Content-Type', 'application/json')
        .send({
          secureKeyName: 'admin',
          codeJson,
          storageObj: {
            administrator: 'tz1hG1QqTMsd8XPpJkGwRmUeVBdNZSGDCPuQ',
            all_tokens: 0,
            ledger: {},
            metadata: {},
            operators: {},
            paused: false,
            token_metadata: {},
            total_supply: {},
          },
        });

      expect(body).toEqual({
        operation_hash: 'operation_hash',
        contract_address: 'contract_address',
      });
      expect(status).toEqual(201);
    });
  });
});
