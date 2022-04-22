import {
  getContractStorageFromTezosNode,
  getContractStorageObjectFromTezosNode,
} from '../../../../src/lib/storage/get-contract-storage';
import { ClientError } from '../../../../src/const/errors/client-error';
import { TezosService } from '../../../../src/services/tezos';

import { tezosNodeUrl } from '../../../__fixtures__/config';
import {
  FA2Contract5,
  flexibleTokenContract,
  flexibleTokenContractOwner,
} from '../../../__fixtures__/smart-contract';
import { logger } from '../../../__fixtures__/services/logger';
import { InvalidContractAddressError } from '@taquito/utils';

describe('[lib/storage/get-contract-storage]', () => {
  const tezosService = new TezosService(tezosNodeUrl);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#getContractStorageFromTezosNode', () => {
    it('should correctly return the contract storage object', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        flexibleTokenContract,
      );

      expect(storage).toBeDefined();
      expect(JSON.stringify(storage)).toEqual(
        '{' +
          '"allowed":"48950",' +
          '"balances":"48951",' +
          '"decimals":"10",' +
          '"locked":false,' +
          '"name":"name",' +
          '"newOwner":"' +
          flexibleTokenContractOwner +
          '",' +
          '"owner":"' +
          flexibleTokenContractOwner +
          '",' +
          '"symbol":"symbol",' +
          '"totalSupply":"40"' +
          '}',
      );
    });

    it('should throw ClientError if the contract address does not exist', async () => {
      const loggerInfoSpy = jest.spyOn(logger, 'info');

      await expect(
        getContractStorageFromTezosNode(logger, tezosService, FA2Contract5),
      ).rejects.toThrow(
        new ClientError({
          message: 'Http error response: (404) ',
          status: 404,
        }),
      );

      expect(loggerInfoSpy.mock.calls).toEqual([
        [
          {
            contractAddress: FA2Contract5,
            message: 'Http error response: (404) ',
          },
          '[lib/storage/get-contract-storage/#getContractStorageFromTezosNode] A client error happened while retrieving contract storage from tezos node',
        ],
      ]);
    });

    it('should throw ClientError if the contract address is not well-formatted', async () => {
      await expect(
        getContractStorageFromTezosNode(logger, tezosService, 'toto'),
      ).rejects.toThrowError(InvalidContractAddressError);
    });

    it('should throw an error and log error if unexpected error happened', async () => {
      const loggerErrorSpy = jest.spyOn(logger, 'error');
      const getContractSpy = jest
        .spyOn(tezosService, 'getContract')
        .mockRejectedValue(new Error('Unexpected error'));

      await expect(
        getContractStorageFromTezosNode(
          logger,
          tezosService,
          flexibleTokenContract,
        ),
      ).rejects.toThrow(Error('Unexpected error'));

      expect(getContractSpy.mock.calls).toEqual([[flexibleTokenContract]]);

      expect(loggerErrorSpy.mock.calls).toEqual([
        [
          {
            contractAddress: flexibleTokenContract,
            message: 'Unexpected error',
          },
          '[lib/storage/get-contract-storage/#getContractStorageFromTezosNode] Unexpected error',
        ],
      ]);
    });
  });

  describe('#getContractStorageObjectFromTezosNode', () => {
    it('should correctly return the contract storage object when dataFields is not defined', async () => {
      const storage = await getContractStorageObjectFromTezosNode(
        logger,
        tezosService,
        flexibleTokenContract,
      );

      expect(storage).toEqual({
        allowed: {
          type: 'big_map',
          value: '48950',
        },
        balances: {
          type: 'big_map',
          value: '48951',
        },
        decimals: 10,
        locked: false,
        name: 'name',
        newOwner: flexibleTokenContractOwner,
        owner: flexibleTokenContractOwner,
        symbol: 'symbol',
        totalSupply: 40,
      });
    });

    it('should correctly return the contract storage object with only the mentioned dataFields', async () => {
      const storage = await getContractStorageObjectFromTezosNode(
        logger,
        tezosService,
        flexibleTokenContract,
        ['allowed', 'age', 'name', 'decimals'],
      );

      expect(storage).toEqual({
        allowed: {
          type: 'big_map',
          value: '48950',
        },
        age: {
          error: 'This data field does not exist in the contract storage',
        },
        decimals: 10,
        name: 'name',
      });
    });

    it('should ignore the empty object or empty string', async () => {
      const storage = await getContractStorageObjectFromTezosNode(
        logger,
        tezosService,
        flexibleTokenContract,
        ['allowed', 'age', 'name', 'decimals', {}, ''],
      );

      expect(storage).toEqual({
        allowed: {
          type: 'big_map',
          value: '48950',
        },
        age: {
          error: 'This data field does not exist in the contract storage',
        },
        decimals: 10,
        name: 'name',
      });
    });
  });
});
