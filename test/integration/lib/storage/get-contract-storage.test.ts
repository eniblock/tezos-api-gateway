import {
  getContractStorageFromTezosNode,
  getContractStorageObjectFromTezosNode,
} from '../../../../src/lib/storage/get-contract-storage';
import { ClientError } from '../../../../src/const/errors/client-error';
import { TezosService } from '../../../../src/services/tezos';

import { tezosNodeGranadaUrl } from '../../../__fixtures__/config';
import {
  FA2Contract5,
  flexibleTokenContract,
  testAccount,
} from '../../../__fixtures__/smart-contract';
import { logger } from '../../../__fixtures__/services/logger';

describe('[lib/storage/get-contract-storage]', () => {
  const tezosService = new TezosService(tezosNodeGranadaUrl);

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
          '"allowed":"16641",' +
          '"balances":"16642",' +
          '"decimals":"10",' +
          '"locked":false,' +
          '"name":"name",' +
          '"newOwner":"' +
          testAccount +
          '",' +
          '"owner":"' +
          testAccount +
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
      const loggerInfoSpy = jest.spyOn(logger, 'info');

      await expect(
        getContractStorageFromTezosNode(logger, tezosService, 'toto'),
      ).rejects.toThrow(
        new ClientError({
          message:
            'Http error response: (400) Failed to parsed an argument in path. After "chains/main/blocks/head/context/contracts/toto", ' +
            'the value "Cannot parse contract id" is not acceptable for type "contract_id"',
          status: 400,
        }),
      );

      expect(loggerInfoSpy.mock.calls).toEqual([
        [
          {
            contractAddress: 'toto',
            message:
              'Http error response: (400) Failed to parsed an argument in path. After "chains/main/blocks/head/context/contracts/toto", ' +
              'the value "Cannot parse contract id" is not acceptable for type "contract_id"',
          },
          '[lib/storage/get-contract-storage/#getContractStorageFromTezosNode] A client error happened while retrieving contract storage from tezos node',
        ],
      ]);
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
          value: '16641',
        },
        balances: {
          type: 'big_map',
          value: '16642',
        },
        decimals: 10,
        locked: false,
        name: 'name',
        newOwner: testAccount,
        owner: testAccount,
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
          value: '16641',
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
          value: '16641',
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
