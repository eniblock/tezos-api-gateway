import { MichelsonMap } from '@taquito/taquito';

import {
  convertMichelsonMapToArrayObject,
  generateStorageResponse,
} from '../../../../src/lib/storage/generate-storage-response';
import { getContractStorageFromTezosNode } from '../../../../src/lib/storage/get-contract-storage';
import { TezosService } from '../../../../src/services/tezos';

import { tezosNodeEdonetUrl } from '../../../__fixtures__/config';
import { flexibleTokenContract } from '../../../__fixtures__/smart-contract';
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
        newOwner: 'tz1iaJAxXAa5SCkdPBLA7f5Lj4LXS5vNa33E',
        owner: 'tz1iaJAxXAa5SCkdPBLA7f5Lj4LXS5vNa33E',
        symbol: 'symbol',
        totalSupply: 100000000000000000,
      });
    });

    it('should correctly return the storage response with michelson map and big map', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        'KT1NxDQoWRj1TLrbpCtkSX6eVyrkxwZEdGfR',
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
              key: 'tz1SCHPVsh2xvNWJSUSqkn3Hf7ri6d3FUjqw',
              value: {
                name: 'tata',
                publicKey: '',
                publicKeyHash: 'tz1SCHPVsh2xvNWJSUSqkn3Hf7ri6d3FUjqw',
              },
            },
            {
              key: 'tz1XByDAXZZVEAb6HPxTBsPPaEbHvtPVXmhK',
              value: {
                name: 'toto',
                publicKey: '',
                publicKeyHash: 'tz1XByDAXZZVEAb6HPxTBsPPaEbHvtPVXmhK',
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
        'KT1TVGnujXh7VhaSP7K1aEji5HvAKRyn6cXf',
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
                address: 'tz1SCHPVsh2xvNWJSUSqkn3Hf7ri6d3FUjqw',
                jwtToken: 'jwt',
              },
              value: {
                name: 'tata',
                publicKey: 'tata public key',
                publicKeyHash: 'tz1SCHPVsh2xvNWJSUSqkn3Hf7ri6d3FUjqw',
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
                address: 'tz1XByDAXZZVEAb6HPxTBsPPaEbHvtPVXmhK',
                jwtToken: 'jwt',
              },
              value: {
                name: 'toto',
                publicKey: 'toto public key',
                publicKeyHash: 'tz1XByDAXZZVEAb6HPxTBsPPaEbHvtPVXmhK',
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
