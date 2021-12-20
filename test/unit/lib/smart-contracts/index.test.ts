import { TezosService } from '../../../../src/services/tezos';
import { tezosNodeUrl } from '../../../__fixtures__/config';
import {
  FA2Contract,
  ProxyContract,
  SingleEntrypointContract,
  testAccount,
  testAccount2,
} from '../../../__fixtures__/smart-contract';
import {
  formatEntryPointParameters,
  getContractMethod,
  getTransferToParams,
} from '../../../../src/lib/smart-contracts';
import {
  ContractAbstraction,
  ContractProvider,
  MichelsonMap,
} from '@taquito/taquito';
import { logger } from '../../../__fixtures__/services/logger';
import {
  InvalidMapStructureParams,
  InvalidParameter,
  InvalidParameterName,
  InvalidVariantObject,
  MissingParameter,
} from '../../../../src/const/errors/invalid-entry-point-params';
import { TestContractMethod } from '../../../__fixtures__/contract-method';

// tslint:disable-next-line:no-var-requires
const createToken = require('@taquito/michelson-encoder/dist/lib/tokens/createToken');

describe('[lib/smart-contracts] Index', () => {
  const tezosService = new TezosService(tezosNodeUrl);
  let fa2Contract: ContractAbstraction<ContractProvider>;
  let singleEntrypointContract: ContractAbstraction<ContractProvider>;
  let proxyContract: ContractAbstraction<ContractProvider>;

  beforeAll(async () => {
    fa2Contract = await tezosService.getContract(FA2Contract);
    singleEntrypointContract = await tezosService.getContract(
      SingleEntrypointContract,
    );
    proxyContract = await tezosService.getContract(ProxyContract);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#getContractMethod', () => {
    const testContractMethod = new TestContractMethod();
    let method: jest.Mock;

    let contract: ContractAbstraction<ContractProvider>;

    beforeEach(() => {
      method = jest.fn().mockImplementation(() => testContractMethod);

      contract = ({
        entrypoints: {
          entrypoints: {
            transfer: {
              prim: 'pair',
              args: [
                {
                  prim: 'nat',
                  annots: ['%tokens'],
                },
                {
                  prim: 'address',
                  annots: ['%destination'],
                },
              ],
            },
            transfer_2: {
              prim: 'list',
              args: [
                {
                  prim: 'string',
                },
              ],
            },
            transfer_3: {
              prim: 'map',
              args: [
                {
                  prim: 'string',
                },
                {
                  prim: 'address',
                },
              ],
            },
          },
        },
        parameterSchema: {
          ExtractSchema() {
            return {
              transfer: {
                tokens: 'nat',
                destination: 'address',
              },
              transfer_2: 'list',
              transfer_3: {
                map: {
                  key: 'string',
                  value: 'address',
                },
              },
            };
          },
        },
        methods: {
          transfer: method,
          transfer_2: method,
          transfer_3: method,
        },
      } as unknown) as ContractAbstraction<ContractProvider>;

      jest.spyOn(testContractMethod, 'schema', 'get').mockReturnValue({
        tokens: 'nat',
        destination: 'address',
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should return the test contract method', () => {
      expect(
        getContractMethod(logger, contract, 'transfer', {
          destination: 'fake_destination',
          tokens: 10,
        }),
      ).toEqual(testContractMethod);

      expect(method).toHaveBeenNthCalledWith(1, 10, 'fake_destination');
    });

    it('should return the method correctly when params is empty', () => {
      expect(getContractMethod(logger, contract, 'transfer')).toEqual(
        testContractMethod,
      );

      expect(method.mock.calls).toEqual([[0]]);
    });

    it('should return the method correctly when params is not an object', () => {
      expect(getContractMethod(logger, contract, 'transfer', 'toto')).toEqual(
        testContractMethod,
      );

      expect(method.mock.calls).toEqual([['toto']]);
    });

    it('should return the method correctly when params is an array', () => {
      expect(
        getContractMethod(logger, contract, 'transfer_2', ['toto']),
      ).toEqual(testContractMethod);

      expect(method.mock.calls).toEqual([[['toto']]]);
    });

    it('should throw InvalidParameter when an object is passed instead of an array', () => {
      expect(() =>
        getContractMethod(logger, contract, 'transfer_2', { toto: 'toto' }),
      ).toThrow(InvalidParameter);
    });

    it('should throw InvalidParameter when an array is passed instead of an object', () => {
      expect(() =>
        getContractMethod(logger, contract, 'transfer', [
          {
            destination: 'fake_destination',
            tokens: 10,
          },
        ]),
      ).toThrow(InvalidParameter);
    });

    it('should correctly form a Michelson Map if there is a map in the schema', () => {
      expect(
        getContractMethod(logger, contract, 'transfer_3', [
          { key: 'toto', value: 'tata' },
        ]),
      ).toEqual(testContractMethod);

      const map = MichelsonMap.fromLiteral({ toto: 'tata' });

      expect(method).toHaveBeenNthCalledWith(1, map);
    });

    it('should throw MissingParameter when the entry point params does not match the entry point schema', () => {
      expect(() =>
        getContractMethod(
          logger,
          (contract as unknown) as ContractAbstraction<ContractProvider>,
          'transfer',
          {
            destination: 'fake_destination',
            fake_tokens: 10,
          },
        ),
      ).toThrow(MissingParameter);
    });

    it('should throw InvalidMapStructureParams when the parameter which should be a map is not an array', () => {
      expect(() =>
        getContractMethod(logger, contract, 'transfer_3', {
          tokens: { key: 'toto', value: 'tata' },
        }),
      ).toThrow(InvalidMapStructureParams);
    });

    it('should throw InvalidMapStructureParams when the parameter which should be a map does not match the map structure', () => {
      expect(() =>
        getContractMethod(logger, contract, 'transfer_3', [{ toto: 'tata' }]),
      ).toThrow(InvalidMapStructureParams);
    });

    it('should correctly accept both "default" and the real entrypoint name when the contract have a single entrypoint"  ', () => {
      const operation = {
        amount: 0,
        mutez: false,
        parameter: {
          entrypoint: 'default',
          value: [
            {
              args: [
                {
                  args: [
                    {
                      string: 'tz1VbHay2YPpiuPYs8SQHynuW3YvGtNuB29z',
                    },
                    {
                      args: [
                        {
                          string: 'tz1Ric9o7YeBvbxXHnxhBMAjaMgKUnHUbYKB',
                        },
                        {
                          int: '0',
                        },
                      ],
                      prim: 'Pair',
                    },
                  ],
                  prim: 'Pair',
                },
              ],
              prim: 'Left',
            },
          ],
        },
        to: 'KT1BMBACEe8XXLR4XiL3qDdUDX7GxpwA53sU',
      };
      const params = [
        {
          add_operator: {
            operator: testAccount,
            owner: testAccount2,
            token_id: 0,
          },
        },
      ];

      let contractMethod = getContractMethod(
        logger,
        singleEntrypointContract,
        'single_entry',
        params,
      );
      expect(contractMethod.toTransferParams()).toEqual(operation);

      contractMethod = getContractMethod(
        logger,
        singleEntrypointContract,
        'default',
        params,
      );
      expect(contractMethod.toTransferParams()).toEqual(operation);
    });
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

    it('should throw InvalidVariantObject error when a variant object contains more then one field', async () => {
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
      expect(() =>
        formatEntryPointParameters(params, token, false, schema),
      ).toThrow(InvalidVariantObject);
    });

    it('should throw InvalidParameterName when variant name is invalid', async () => {
      const entryPoint = 'update_operators';
      const params = [
        {
          fake_variant: {
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
      expect(() =>
        formatEntryPointParameters(params, token, false, schema),
      ).toThrow(InvalidParameterName);
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
