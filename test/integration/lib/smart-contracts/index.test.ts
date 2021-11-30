import { TezosService } from '../../../../src/services/tezos';

import { tezosNodeGranadaUrl } from '../../../__fixtures__/config';
import {
  FA2Contract,
  ProxyContract,
} from '../../../__fixtures__/smart-contract';
import {
  formatEntryPointParameters,
  getTransferToParams,
} from '../../../../src/lib/smart-contracts';
import {
  ContractAbstraction,
  ContractProvider,
  MichelsonMap,
} from '@taquito/taquito';
import { logger } from '../../../__fixtures__/services/logger';
import { InvalidVariantObject } from '../../../../src/const/errors/invalid-entry-point-params';

// tslint:disable-next-line:no-var-requires
const createToken = require('@taquito/michelson-encoder/dist/lib/tokens/createToken');

describe('[lib/smart-contracts] Index', () => {
  const tezosService = new TezosService(tezosNodeGranadaUrl);
  let fa2Contract: ContractAbstraction<ContractProvider>;
  let proxyContract: ContractAbstraction<ContractProvider>;

  beforeAll(async () => {
    fa2Contract = await tezosService.getContract(FA2Contract);
    proxyContract = await tezosService.getContract(ProxyContract);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#formatEntryPointParameters', () => {
    it('should correctly return a list that contains the parameter when the entrypoint requires one single parameter', async () => {
      const params = 'True';
      const entryPoint = 'set_pause';
      const schema = fa2Contract.parameterSchema.ExtractSchema()[
        `${entryPoint}`
      ];
      const mickelsonSchema =
        fa2Contract.entrypoints.entrypoints[`${entryPoint}`];
      const token = createToken.createToken(mickelsonSchema, 0);

      const res = formatEntryPointParameters(params, token, false, schema);
      expect(res).toEqual(['True']);
    });

    it('should correctly return the parameters list with correctly formatted FA2 mint parameters', async () => {
      const entryPoint = 'mint';
      const params = {
        address: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
        amount: 1,
        metadata: [
          {
            key: '',
            value:
              '050100000035697066733a2f2f516d5a36584762695a4d77664454325066436e71747462426e564d4a727473397670636867575251544b33337762',
          },
        ],
        token_id: 0,
      };
      const schema = fa2Contract.parameterSchema.ExtractSchema()[
        `${entryPoint}`
      ];
      const mickelsonSchema =
        fa2Contract.entrypoints.entrypoints[`${entryPoint}`];
      const token = createToken.createToken(mickelsonSchema, 0);

      const res = formatEntryPointParameters(params, token, false, schema);
      const metadata = new MichelsonMap();
      metadata.set(params.metadata[0].key, params.metadata[0].value);
      expect(res).toEqual([
        params.address,
        params.amount,
        metadata,
        params.token_id,
      ]);
    });

    it('should correctly return the parameters list with correctly formatted FA2 update_operators parameters', async () => {
      const entryPoint = 'update_operators';
      const params = [
        {
          add_operator: {
            owner: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
            operator: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
            token_id: 0,
          },
        },
        {
          remove_operator: {
            owner: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
            operator: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
            token_id: 0,
          },
        },
      ];
      const schema = fa2Contract.parameterSchema.ExtractSchema()[
        `${entryPoint}`
      ];
      const mickelsonSchema =
        fa2Contract.entrypoints.entrypoints[`${entryPoint}`];
      const token = createToken.createToken(mickelsonSchema, 0);

      const res = formatEntryPointParameters(params, token, false, schema);
      expect(res).toEqual([params]);
    });

    it('should throw an error when a variant object contains more then one field', async () => {
      const entryPoint = 'update_operators';
      const params = [
        {
          add_operator: {
            owner: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
            operator: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
            token_id: 0,
          },
          remove_operator: {
            owner: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
            operator: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
            token_id: 0,
          },
        },
      ];
      const schema = fa2Contract.parameterSchema.ExtractSchema()[
        `${entryPoint}`
      ];
      const mickelsonSchema =
        fa2Contract.entrypoints.entrypoints[`${entryPoint}`];
      const token = createToken.createToken(mickelsonSchema, 0);
      try {
        formatEntryPointParameters(params, token, false, schema);
      } catch (err) {
        expect(err).toEqual(new InvalidVariantObject(2));
      }
    });

    it('should correctly return the parameters list with correctly formatted FA2 transfer parameters', async () => {
      const entryPoint = 'transfer';
      const params = [
        {
          from_: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
          txs: [
            {
              to_: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
              amount: 10,
              token_id: 0,
            },
            {
              to_: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
              amount: 5,
              token_id: 1,
            },
          ],
        },
        {
          from_: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
          txs: [
            {
              to_: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
              amount: 6,
              token_id: 0,
            },
            {
              to_: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
              amount: 3,
              token_id: 1,
            },
          ],
        },
      ];
      const schema = fa2Contract.parameterSchema.ExtractSchema()[
        `${entryPoint}`
      ];
      const mickelsonSchema =
        fa2Contract.entrypoints.entrypoints[`${entryPoint}`];
      const token = createToken.createToken(mickelsonSchema, 0);

      const res = formatEntryPointParameters(params, token, false, schema);
      expect(res).toEqual([params]);
    });

    it('should correctly return the parameters list with correctly formatted Proxy update_groups parameters', async () => {
      const entryPoint = 'update_groups';
      const params = [
        {
          add: [
            {
              key: 'test',
              value: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
            },
          ],
        },
        {
          remove: [
            {
              key: 'test',
              value: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
            },
          ],
        },
      ];
      const schema = proxyContract.parameterSchema.ExtractSchema()[
        `${entryPoint}`
      ];
      const mickelsonSchema =
        proxyContract.entrypoints.entrypoints[`${entryPoint}`];
      const token = createToken.createToken(mickelsonSchema, 0);
      const res = formatEntryPointParameters(params, token, false, schema);

      const add = new MichelsonMap();
      if (params[0]!.add)
        add.set(params[0]!.add[0].key, params[0]!.add[0].value);
      const remove = new MichelsonMap();
      if (params[1]!.remove)
        remove.set(params[1].remove[0].key, params[1].remove[0].value);
      expect(res).toEqual([
        [
          {
            add,
          },
          {
            remove,
          },
        ],
      ]);
    });

    it('should correctly return the parameters list with correctly formatted Proxy update_templates parameters', async () => {
      const entryPoint = 'update_templates';
      const params = [
        {
          update: [
            {
              key: 3,
              value: {
                contract_threshold: 1,
                groups: [
                  {
                    key: 'super_fa2_admins',
                    value: {
                      group_threshold: 1,
                      group_weight: 1,
                    },
                  },
                ],
              },
            },
          ],
        },
        {
          remove: [2],
        },
      ];
      const schema = proxyContract.parameterSchema.ExtractSchema()[
        `${entryPoint}`
      ];
      const mickelsonSchema =
        proxyContract.entrypoints.entrypoints[`${entryPoint}`];
      const token = createToken.createToken(mickelsonSchema, 0);
      const res = formatEntryPointParameters(params, token, false, schema);

      const update = new MichelsonMap();
      const groups = new MichelsonMap();
      groups.set('super_fa2_admins', { group_threshold: 1, group_weight: 1 });
      update.set(3, { contract_threshold: 1, groups });
      expect(res).toEqual([
        [
          {
            update,
          },
          {
            remove: [2],
          },
        ],
      ]);
    });

    it('should correctly return the parameters list with correctly formatted Proxy update_rules parameters', async () => {
      const entryPoint = 'update_rules';
      const params = [
        {
          update: [
            {
              key: 'mint',
              value: {
                template_id: 0,
                authorized_builders: ['minters', 'batch_minters'],
              },
            },
          ],
        },
        {
          remove: ['batch_mint'],
        },
      ];
      const schema = proxyContract.parameterSchema.ExtractSchema()[
        `${entryPoint}`
      ];
      const mickelsonSchema =
        proxyContract.entrypoints.entrypoints[`${entryPoint}`];
      const token = createToken.createToken(mickelsonSchema, 0);
      const res = formatEntryPointParameters(params, token, false, schema);

      const update = new MichelsonMap();
      if (params[0]!.update)
        update.set(params[0]!.update[0].key, params[0]!.update[0].value);
      expect(res).toEqual([
        [
          {
            update,
          },
          {
            remove: ['batch_mint'],
          },
        ],
      ]);
    });

    it('should correctly return the parameters list with correctly formatted Proxy build (mint) parameters with non-null optional operator', async () => {
      const entryPoint = 'build';
      const params = {
        build_and_sign: 'True',
        call_params: {
          entry_point: 'mint',
          parameters: {
            mint: {
              mint_params: {
                address: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
                amount: 1,
                metadata: [
                  {
                    key: '',
                    value:
                      '050100000035697066733a2f2f516d5a36584762695a4d77664454325066436e71747462426e564d4a727473397670636867575251544b33337762',
                  },
                ],
                token_id: 0,
              },
              operator: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
            },
          },
          target_address: 'KT1JvbC6tgW1PUBP6bKxcnJaq4ncy2VJBBAY',
        },
        multisig_id: '11225544',
        signers: [],
      };
      const schema = proxyContract.parameterSchema.ExtractSchema()[
        `${entryPoint}`
      ];
      const mickelsonSchema =
        proxyContract.entrypoints.entrypoints[`${entryPoint}`];
      const token = createToken.createToken(mickelsonSchema, 0);
      const res = formatEntryPointParameters(params, token, false, schema);

      const metadata = new MichelsonMap();
      const metadataValue =
        params.call_params.parameters.mint.mint_params.metadata[0];
      if (metadataValue) metadata.set(metadataValue.key, metadataValue.value);
      expect(res).toEqual([
        'True',
        'mint',
        'mint',
        'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
        1,
        metadata,
        0,
        'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
        'KT1JvbC6tgW1PUBP6bKxcnJaq4ncy2VJBBAY',
        '11225544',
        [],
      ]);
    });

    it('should correctly return the parameters list with correctly formatted Proxy build (mint) parameters with null optional operator', async () => {
      const entryPoint = 'build';
      const params = {
        build_and_sign: 'True',
        call_params: {
          entry_point: 'mint',
          parameters: {
            mint: {
              mint_params: {
                address: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
                amount: 1,
                metadata: [
                  {
                    key: '',
                    value:
                      '050100000035697066733a2f2f516d5a36584762695a4d77664454325066436e71747462426e564d4a727473397670636867575251544b33337762',
                  },
                ],
                token_id: 0,
              },
              operator: null,
            },
          },
          target_address: 'KT1JvbC6tgW1PUBP6bKxcnJaq4ncy2VJBBAY',
        },
        multisig_id: '11225544',
        signers: [],
      };
      const schema = proxyContract.parameterSchema.ExtractSchema()[
        `${entryPoint}`
      ];
      const mickelsonSchema =
        proxyContract.entrypoints.entrypoints[`${entryPoint}`];
      const token = createToken.createToken(mickelsonSchema, 0);
      const res = formatEntryPointParameters(params, token, false, schema);

      const metadata = new MichelsonMap();
      const metadataValue =
        params.call_params.parameters.mint.mint_params.metadata[0];
      if (metadataValue) metadata.set(metadataValue.key, metadataValue.value);
      expect(res).toEqual([
        'True',
        'mint',
        'mint',
        'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
        1,
        metadata,
        0,
        null,
        'KT1JvbC6tgW1PUBP6bKxcnJaq4ncy2VJBBAY',
        '11225544',
        [],
      ]);
    });
  });

  describe('#getTransferToParams', () => {
    it('should correctly return the operation object with correctly formatted bool parameter', async () => {
      const entryPoint = 'set_pause';
      const params = 'True';

      const res = getTransferToParams(logger, fa2Contract, entryPoint, params);
      expect(res).toEqual({
        amount: 0,
        fee: undefined,
        gasLimit: undefined,
        mutez: false,
        parameter: {
          entrypoint: `${entryPoint}`,
          value: {
            prim: 'True',
          },
        },
        source: undefined,
        storageLimit: undefined,
        to: `${FA2Contract}`,
      });
    });

    it('should correctly return the operation object with correctly formatted FA2 mint parameters', async () => {
      const entryPoint = 'mint';
      const params = {
        address: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
        amount: 1,
        metadata: [
          {
            key: '',
            value:
              '050100000035697066733a2f2f516d5a36584762695a4d77664454325066436e71747462426e564d4a727473397670636867575251544b33337762',
          },
        ],
        token_id: 0,
      };

      const res = getTransferToParams(logger, fa2Contract, entryPoint, params);
      expect(res).toEqual({
        amount: 0,
        fee: undefined,
        gasLimit: undefined,
        mutez: false,
        parameter: {
          entrypoint: `${entryPoint}`,
          value: {
            prim: 'Pair',
            args: [
              {
                prim: 'Pair',
                args: [
                  {
                    string: `${params.address}`,
                  },
                  {
                    int: `${params.amount}`,
                  },
                ],
              },
              {
                prim: 'Pair',
                args: [
                  [
                    {
                      prim: 'Elt',
                      args: [
                        {
                          string: `${params.metadata[0].key}`,
                        },
                        {
                          bytes: `${params.metadata[0].value}`,
                        },
                      ],
                    },
                  ],
                  {
                    int: `${params.token_id}`,
                  },
                ],
              },
            ],
          },
        },
        source: undefined,
        storageLimit: undefined,
        to: `${FA2Contract}`,
      });
    });

    it('should correctly return the operation object with correctly formatted FA2 update_operators parameters', async () => {
      const entryPoint = 'update_operators';
      const params = [
        {
          add_operator: {
            owner: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
            operator: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
            token_id: 0,
          },
        },
        {
          remove_operator: {
            owner: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
            operator: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
            token_id: 0,
          },
        },
      ];

      const res = getTransferToParams(logger, fa2Contract, entryPoint, params);
      expect(res).toEqual({
        amount: 0,
        fee: undefined,
        gasLimit: undefined,
        mutez: false,
        parameter: {
          entrypoint: `${entryPoint}`,
          value: [
            {
              prim: 'Left',
              args: [
                {
                  prim: 'Pair',
                  args: [
                    {
                      string: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                    },
                    {
                      prim: 'Pair',
                      args: [
                        {
                          string: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
                        },
                        {
                          int: '0',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              prim: 'Right',
              args: [
                {
                  prim: 'Pair',
                  args: [
                    {
                      string: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                    },
                    {
                      prim: 'Pair',
                      args: [
                        {
                          string: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
                        },
                        {
                          int: '0',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        source: undefined,
        storageLimit: undefined,
        to: `${FA2Contract}`,
      });
    });

    it('should correctly return the operation object with correctly formatted FA2 transfer parameters', async () => {
      const entryPoint = 'transfer';
      const params = [
        {
          from_: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
          txs: [
            {
              to_: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
              amount: 10,
              token_id: 0,
            },
            {
              to_: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
              amount: 5,
              token_id: 1,
            },
          ],
        },
        {
          from_: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
          txs: [
            {
              to_: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
              amount: 6,
              token_id: 0,
            },
            {
              to_: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
              amount: 3,
              token_id: 1,
            },
          ],
        },
      ];

      const res = getTransferToParams(logger, fa2Contract, entryPoint, params);
      expect(res).toEqual({
        amount: 0,
        fee: undefined,
        gasLimit: undefined,
        mutez: false,
        parameter: {
          entrypoint: `${entryPoint}`,
          value: [
            {
              prim: 'Pair',
              args: [
                {
                  string: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
                },
                [
                  {
                    prim: 'Pair',
                    args: [
                      {
                        string: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                      },
                      {
                        prim: 'Pair',
                        args: [
                          {
                            int: '0',
                          },
                          {
                            int: '10',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    prim: 'Pair',
                    args: [
                      {
                        string: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                      },
                      {
                        prim: 'Pair',
                        args: [
                          {
                            int: '1',
                          },
                          {
                            int: '5',
                          },
                        ],
                      },
                    ],
                  },
                ],
              ],
            },
            {
              prim: 'Pair',
              args: [
                {
                  string: 'tz1ZQYMDETodNBAc2XVbhZFGme8KniuPqrSw',
                },
                [
                  {
                    prim: 'Pair',
                    args: [
                      {
                        string: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
                      },
                      {
                        prim: 'Pair',
                        args: [
                          {
                            int: '0',
                          },
                          {
                            int: '6',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    prim: 'Pair',
                    args: [
                      {
                        string: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
                      },
                      {
                        prim: 'Pair',
                        args: [
                          {
                            int: '1',
                          },
                          {
                            int: '3',
                          },
                        ],
                      },
                    ],
                  },
                ],
              ],
            },
          ],
        },
        source: undefined,
        storageLimit: undefined,
        to: `${FA2Contract}`,
      });
    });

    it('should correctly return the operation object with correctly formatted Proxy update_groups parameters', async () => {
      const entryPoint = 'update_groups';
      const params = [
        {
          add: [
            {
              key: 'test',
              value: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
            },
          ],
        },
        {
          remove: [
            {
              key: 'test',
              value: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
            },
          ],
        },
      ];
      const res = getTransferToParams(
        logger,
        proxyContract,
        entryPoint,
        params,
      );
      expect(res).toEqual({
        amount: 0,
        fee: undefined,
        gasLimit: undefined,
        mutez: false,
        parameter: {
          entrypoint: `${entryPoint}`,
          value: [
            {
              args: [
                [
                  {
                    args: [
                      {
                        string: 'test',
                      },
                      {
                        string: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
                      },
                    ],
                    prim: 'Elt',
                  },
                ],
              ],
              prim: 'Left',
            },
            {
              args: [
                [
                  {
                    args: [
                      {
                        string: 'test',
                      },
                      {
                        string: 'tz1ernQcEU7qqR1t9R4mPFUCSkp9DLQqA7hW',
                      },
                    ],
                    prim: 'Elt',
                  },
                ],
              ],
              prim: 'Right',
            },
          ],
        },
        source: undefined,
        storageLimit: undefined,
        to: `${ProxyContract}`,
      });
    });

    it('should correctly return the operation object with correctly formatted Proxy update_templates parameters', async () => {
      const entryPoint = 'update_templates';
      const params = [
        {
          update: [
            {
              key: 3,
              value: {
                contract_threshold: 1,
                groups: [
                  {
                    key: 'super_fa2_admins',
                    value: {
                      group_threshold: 1,
                      group_weight: 1,
                    },
                  },
                ],
              },
            },
          ],
        },
        {
          remove: [2],
        },
      ];
      const res = getTransferToParams(
        logger,
        proxyContract,
        entryPoint,
        params,
      );
      expect(res).toEqual({
        amount: 0,
        fee: undefined,
        gasLimit: undefined,
        mutez: false,
        parameter: {
          entrypoint: `${entryPoint}`,
          value: [
            {
              args: [
                [
                  {
                    args: [
                      {
                        int: '3',
                      },
                      {
                        args: [
                          {
                            int: '1',
                          },
                          [
                            {
                              args: [
                                {
                                  string: 'super_fa2_admins',
                                },
                                {
                                  args: [
                                    {
                                      int: '1',
                                    },
                                    {
                                      int: '1',
                                    },
                                  ],
                                  prim: 'Pair',
                                },
                              ],
                              prim: 'Elt',
                            },
                          ],
                        ],
                        prim: 'Pair',
                      },
                    ],
                    prim: 'Elt',
                  },
                ],
              ],
              prim: 'Right',
            },
            {
              args: [
                [
                  {
                    int: '2',
                  },
                ],
              ],
              prim: 'Left',
            },
          ],
        },
        source: undefined,
        storageLimit: undefined,
        to: `${ProxyContract}`,
      });
    });

    it('should correctly return the operation object with correctly formatted Proxy update_rules parameters', async () => {
      const entryPoint = 'update_rules';
      const params = [
        {
          update: [
            {
              key: 'mint',
              value: {
                template_id: 0,
                authorized_builders: ['minters', 'batch_minters'],
              },
            },
          ],
        },
        {
          remove: ['batch_mint'],
        },
      ];
      const res = getTransferToParams(
        logger,
        proxyContract,
        entryPoint,
        params,
      );
      expect(res).toEqual({
        amount: 0,
        fee: undefined,
        gasLimit: undefined,
        mutez: false,
        parameter: {
          entrypoint: `${entryPoint}`,
          value: [
            {
              args: [
                [
                  {
                    args: [
                      {
                        string: 'mint',
                      },
                      {
                        args: [
                          [
                            {
                              string: 'batch_minters',
                            },
                            {
                              string: 'minters',
                            },
                          ],
                          {
                            int: '0',
                          },
                        ],
                        prim: 'Pair',
                      },
                    ],
                    prim: 'Elt',
                  },
                ],
              ],
              prim: 'Right',
            },
            {
              args: [
                [
                  {
                    string: 'batch_mint',
                  },
                ],
              ],
              prim: 'Left',
            },
          ],
        },
        source: undefined,
        storageLimit: undefined,
        to: `${ProxyContract}`,
      });
    });

    it('should correctly return the operation object with correctly formatted Proxy build (mint) parameters with non-null optional operator', async () => {
      const entryPoint = 'build';
      const params = {
        build_and_sign: 'True',
        call_params: {
          entry_point: 'mint',
          parameters: {
            mint: {
              mint_params: {
                address: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
                amount: 1,
                metadata: [
                  {
                    key: '',
                    value:
                      '050100000035697066733a2f2f516d5a36584762695a4d77664454325066436e71747462426e564d4a727473397670636867575251544b33337762',
                  },
                ],
                token_id: 0,
              },
              operator: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
            },
          },
          target_address: 'KT1JvbC6tgW1PUBP6bKxcnJaq4ncy2VJBBAY',
        },
        multisig_id: '11225544',
        signers: [],
      };
      const res = getTransferToParams(
        logger,
        proxyContract,
        entryPoint,
        params,
      );
      expect(res).toEqual({
        amount: 0,
        fee: undefined,
        gasLimit: undefined,
        mutez: false,
        parameter: {
          entrypoint: `${entryPoint}`,
          value: {
            args: [
              {
                args: [
                  {
                    prim: 'True',
                  },
                  {
                    args: [
                      {
                        string: 'mint',
                      },
                      {
                        args: [
                          {
                            args: [
                              {
                                args: [
                                  {
                                    args: [
                                      {
                                        args: [
                                          {
                                            args: [
                                              {
                                                args: [
                                                  {
                                                    string:
                                                      'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
                                                  },
                                                  {
                                                    int: '1',
                                                  },
                                                ],
                                                prim: 'Pair',
                                              },
                                              {
                                                args: [
                                                  [
                                                    {
                                                      args: [
                                                        {
                                                          string: '',
                                                        },
                                                        {
                                                          bytes:
                                                            '050100000035697066733a2f2f516d5a36584762695a4d77664454325066436e71747462426e564d4a727473397670636867575251544b33337762',
                                                        },
                                                      ],
                                                      prim: 'Elt',
                                                    },
                                                  ],
                                                  {
                                                    int: '0',
                                                  },
                                                ],
                                                prim: 'Pair',
                                              },
                                            ],
                                            prim: 'Pair',
                                          },
                                          {
                                            args: [
                                              {
                                                string:
                                                  'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
                                              },
                                            ],
                                            prim: 'Some',
                                          },
                                        ],
                                        prim: 'Pair',
                                      },
                                    ],
                                    prim: 'Left',
                                  },
                                ],
                                prim: 'Right',
                              },
                            ],
                            prim: 'Left',
                          },
                          {
                            string: 'KT1JvbC6tgW1PUBP6bKxcnJaq4ncy2VJBBAY',
                          },
                        ],
                        prim: 'Pair',
                      },
                    ],
                    prim: 'Pair',
                  },
                ],
                prim: 'Pair',
              },
              {
                args: [
                  {
                    string: '11225544',
                  },
                  [],
                ],
                prim: 'Pair',
              },
            ],
            prim: 'Pair',
          },
        },
        source: undefined,
        storageLimit: undefined,
        to: `${ProxyContract}`,
      });
    });

    it('should correctly return the operation object with correctly formatted Proxy build (mint) parameters with null optional operator', async () => {
      const entryPoint = 'build';
      const params = {
        build_and_sign: 'True',
        call_params: {
          entry_point: 'mint',
          parameters: {
            mint: {
              mint_params: {
                address: 'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
                amount: 1,
                metadata: [
                  {
                    key: '',
                    value:
                      '050100000035697066733a2f2f516d5a36584762695a4d77664454325066436e71747462426e564d4a727473397670636867575251544b33337762',
                  },
                ],
                token_id: 0,
              },
              operator: null,
            },
          },
          target_address: 'KT1JvbC6tgW1PUBP6bKxcnJaq4ncy2VJBBAY',
        },
        multisig_id: '11225544',
        signers: [],
      };
      const res = getTransferToParams(
        logger,
        proxyContract,
        entryPoint,
        params,
      );
      expect(res).toEqual({
        amount: 0,
        fee: undefined,
        gasLimit: undefined,
        mutez: false,
        parameter: {
          entrypoint: `${entryPoint}`,
          value: {
            args: [
              {
                args: [
                  {
                    prim: 'True',
                  },
                  {
                    args: [
                      {
                        string: 'mint',
                      },
                      {
                        args: [
                          {
                            args: [
                              {
                                args: [
                                  {
                                    args: [
                                      {
                                        args: [
                                          {
                                            args: [
                                              {
                                                args: [
                                                  {
                                                    string:
                                                      'tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q',
                                                  },
                                                  {
                                                    int: '1',
                                                  },
                                                ],
                                                prim: 'Pair',
                                              },
                                              {
                                                args: [
                                                  [
                                                    {
                                                      args: [
                                                        {
                                                          string: '',
                                                        },
                                                        {
                                                          bytes:
                                                            '050100000035697066733a2f2f516d5a36584762695a4d77664454325066436e71747462426e564d4a727473397670636867575251544b33337762',
                                                        },
                                                      ],
                                                      prim: 'Elt',
                                                    },
                                                  ],
                                                  {
                                                    int: '0',
                                                  },
                                                ],
                                                prim: 'Pair',
                                              },
                                            ],
                                            prim: 'Pair',
                                          },
                                          {
                                            prim: 'None',
                                          },
                                        ],
                                        prim: 'Pair',
                                      },
                                    ],
                                    prim: 'Left',
                                  },
                                ],
                                prim: 'Right',
                              },
                            ],
                            prim: 'Left',
                          },
                          {
                            string: 'KT1JvbC6tgW1PUBP6bKxcnJaq4ncy2VJBBAY',
                          },
                        ],
                        prim: 'Pair',
                      },
                    ],
                    prim: 'Pair',
                  },
                ],
                prim: 'Pair',
              },
              {
                args: [
                  {
                    string: '11225544',
                  },
                  [],
                ],
                prim: 'Pair',
              },
            ],
            prim: 'Pair',
          },
        },
        source: undefined,
        storageLimit: undefined,
        to: `${ProxyContract}`,
      });
    });
  });
});
