import { MichelsonMap } from '@taquito/taquito';

import {
  convertMichelsonMapToArrayObject,
  generateStorageResponse,
} from '../../../../src/lib/storage/generate-storage-response';
import { getContractStorageFromTezosNode } from '../../../../src/lib/storage/get-contract-storage';
import { TezosService } from '../../../../src/services/tezos';

import { tezosNodeUrl } from '../../../__fixtures__/config';
import {
  FA2Contract3,
  FA2Contract4,
  flexibleTokenContract,
  flexibleTokenContractOwner,
  testAccount,
  testAccount2,
} from '../../../__fixtures__/smart-contract';
import { logger } from '../../../__fixtures__/services/logger';

describe('[lib/storage/generateStorageResponse]', () => {
  const tezosService = new TezosService(tezosNodeUrl);

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

      expect(generateStorageResponse(storage)).toMatchObject({
        allowed: {
          type: 'big_map',
        },
        balances: {
          type: 'big_map',
        },
        decimals: 10,
        locked: false,
        name: 'name',
        newOwner: {
          Some: flexibleTokenContractOwner,
        },
        owner: flexibleTokenContractOwner,
        symbol: 'symbol',
        totalSupply: 40,
      });
    });

    it('should correctly return the storage response with michelson map and big map', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        FA2Contract4,
      );

      expect(generateStorageResponse(storage)).toMatchObject({
        accessRequests: {
          type: 'big_map',
        },
        organizations: [
          {
            key: testAccount2,
            value: {
              name: 'toto',
              publicKey: '',
              publicKeyHash: testAccount2,
            },
          },
          {
            key: testAccount,
            value: {
              name: 'tata',
              publicKey: '',
              publicKeyHash: testAccount,
            },
          },
        ],
      });
    });

    it('should correctly return the storage response with michelson map with object key', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        FA2Contract3,
      );

      expect(generateStorageResponse(storage)).toMatchObject({
        accessRequests: {
          type: 'big_map',
        },
        organizations: [
          {
            key: {
              address: testAccount2,
              jwtToken: 'jwt',
            },
            value: {
              name: 'toto',
              publicKey: 'toto public key',
              publicKeyHash: testAccount2,
              datasources: [
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
          {
            key: {
              address: testAccount,
              jwtToken: 'jwt',
            },
            value: {
              name: 'tata',
              publicKey: 'tata public key',
              publicKeyHash: testAccount,
              datasources: [
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
        ],
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
