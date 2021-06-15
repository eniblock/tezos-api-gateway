import { MichelsonMap } from '@taquito/taquito';

import {
  convertMichelsonMapToArrayObject,
  generateStorageResponse,
} from '../../../../src/lib/storage/generate-storage-response';
import { getContractStorageFromTezosNode } from '../../../../src/lib/storage/get-contract-storage';
import { TezosService } from '../../../../src/services/tezos';

import { tezosNodeEdonetUrl } from '../../../__fixtures__/config';
import {
  FA2Contract3,
  FA2Contract4,
  flexibleTokenContract,
  testAccount,
  testAccount4,
  testAccount5,
} from '../../../__fixtures__/smart-contract';
import { logger } from '../../../__fixtures__/services/logger';

describe('[lib/storage/generateStorageResponse]', () => {
  const tezosService = new TezosService(tezosNodeEdonetUrl);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#generateStorageResponse', () => {
    it('should correctly return the storage response with big map', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        flexibleTokenContract,
      );

      expect(generateStorageResponse(storage!)).toEqual({
        allowed: {
          type: 'big_map',
          value: '37398',
        },
        balances: {
          type: 'big_map',
          value: '37399',
        },
        decimals: 10,
        locked: false,
        name: 'name',
        newOwner: testAccount,
        owner: testAccount,
        symbol: 'symbol',
        totalSupply: 100000000000000000,
      });
    });

    it('should correctly return the storage response with michelson map and big map', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        FA2Contract4,
      );

      expect(generateStorageResponse(storage!)).toEqual({
        accessRequests: {
          type: 'big_map',
          value: '59941',
        },
        organizations: {
          type: 'map',
          size: 2,
          value: [
            {
              key: testAccount4,
              value: {
                name: 'tata',
                publicKey: '',
                publicKeyHash: testAccount4,
              },
            },
            {
              key: testAccount5,
              value: {
                name: 'toto',
                publicKey: '',
                publicKeyHash: testAccount5,
              },
            },
          ],
        },
      });
    });

    it('should correctly return the storage response with michelson map with object key', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        FA2Contract3,
      );

      expect(generateStorageResponse(storage!)).toEqual({
        accessRequests: {
          type: 'big_map',
          value: '59822',
        },
        organizations: {
          type: 'map',
          size: 2,
          value: [
            {
              key: {
                address: testAccount4,
                jwtToken: 'jwt',
              },
              value: {
                name: 'tata',
                publicKey: 'tata public key',
                publicKeyHash: testAccount4,
                datasources: {
                  type: 'map',
                  size: 3,
                  value: [
                    {
                      key: 'datasource4',
                      value: 'value4',
                    },
                    {
                      key: 'datasource5',
                      value: 'value5',
                    },
                    {
                      key: 'datasource6',
                      value: 'value6',
                    },
                  ],
                },
              },
            },
            {
              key: {
                address: testAccount5,
                jwtToken: 'jwt',
              },
              value: {
                name: 'toto',
                publicKey: 'toto public key',
                publicKeyHash: testAccount5,
                datasources: {
                  type: 'map',
                  size: 3,
                  value: [
                    {
                      key: 'datasource1',
                      value: 'value1',
                    },
                    {
                      key: 'datasource2',
                      value: 'value2',
                    },
                    {
                      key: 'datasource3',
                      value: 'value3',
                    },
                  ],
                },
              },
            },
          ],
        },
      });
    });
  });

  describe('#convertMichelsonMapToArrayObject', () => {
    it('should correctly return empty array if the map is empty', async () => {
      const map = new MichelsonMap();

      expect(convertMichelsonMapToArrayObject(map)).toEqual([]);
    });

    it('should correctly return array of object represent the michelson map', async () => {
      const map = new MichelsonMap();
      map.set({ address: 'address' }, 'Paris');

      expect(convertMichelsonMapToArrayObject(map)).toEqual([
        {
          key: { address: 'address' },
          value: 'Paris',
        },
      ]);
    });
  });
});
