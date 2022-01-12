import BigNumber from 'bignumber.js';

import { TezosService } from '../../../../src/services/tezos';
import { convertStorage } from '../../../../src/lib/storage/convert-storage';
import { getContractStorageFromTezosNode } from '../../../../src/lib/storage/get-contract-storage';
import * as generateStorageResponseLib from '../../../../src/lib/storage/generate-storage-response';

import { tezosNodeUrl } from '../../../__fixtures__/config';
import { logger } from '../../../__fixtures__/services/logger';
import {
  FA2Contract3,
  flexibleTokenContract,
  testAccount,
  testAccount2,
} from '../../../__fixtures__/smart-contract';

describe('[lib/storage/convert-storage]', () => {
  const tezosService = new TezosService(tezosNodeUrl);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#convertStorage', () => {
    it('should correctly return the big map value corresponding to the key', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        FA2Contract3,
      );

      await expect(
        convertStorage(
          logger,
          [
            {
              accessRequests: [
                { key: { scopeId: 'scope1', status: 'status1' } },
              ],
            },
          ],
          storage,
        ),
      ).resolves.toEqual({
        accessRequests: [
          {
            key: { scopeId: 'scope1', status: 'status1' },
            value: {
              address: {
                providerAddress: testAccount,
                requesterAddress: testAccount2,
              },
              createdAt: '2019-10-22T16:27:54.000Z',
              jwtToken: 'jwtToken',
            },
          },
        ],
      });
    });

    it('should correctly return the result when get a list of big map keys', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        FA2Contract3,
      );

      await expect(
        convertStorage(
          logger,
          [
            {
              accessRequests: [
                { key: { scopeId: 'scope1', status: 'status1' } },
                { key: { scopeId: 'scope1', status: 'status2' } },
                { key: { scopeId: 'scope2', status: 'status2' } },
              ],
            },
          ],
          storage,
        ),
      ).resolves.toEqual({
        accessRequests: [
          {
            key: { scopeId: 'scope1', status: 'status1' },
            value: {
              address: {
                providerAddress: testAccount,
                requesterAddress: testAccount2,
              },
              createdAt: '2019-10-22T16:27:54.000Z',
              jwtToken: 'jwtToken',
            },
          },
          {
            key: { scopeId: 'scope1', status: 'status2' },
            error: 'The current map does not contain this key',
          },
          {
            key: { scopeId: 'scope2', status: 'status2' },
            value: {
              address: {
                providerAddress: testAccount2,
                requesterAddress: testAccount,
              },
              createdAt: '2019-10-22T16:28:10.000Z',
              jwtToken: null,
            },
          },
        ],
      });
    });

    it('should correctly return the map value corresponding to the keys and only a part of a big map regarding the dataFields', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        FA2Contract3,
      );

      await expect(
        convertStorage(
          logger,
          [
            {
              accessRequests: [
                {
                  key: { scopeId: 'scope1', status: 'status1' },
                  dataFields: [
                    'address.requesterAddress',
                    'address.provider',
                    'jwtToken',
                    'jwtToken.createdAt',
                    'requesterAddress',
                  ],
                },
              ],
            },
            {
              organizations: [
                {
                  key: {
                    address: testAccount2,
                    jwtToken: 'jwt',
                  },
                },
                {
                  key: {
                    address: 'Fake address',
                    jwtToken: 'jwt',
                  },
                },
              ],
            },
            {
              accessRequests2: [
                { key: { scopeId: 'scope1', status: 'status1' } },
              ],
            },
          ],
          storage,
        ),
      ).resolves.toEqual({
        accessRequests: [
          {
            key: { scopeId: 'scope1', status: 'status1' },
            value: {
              'address.requesterAddress': testAccount2,
              'address.provider': {
                error: 'This data field does not exist in the contract storage',
              },
              jwtToken: 'jwtToken',
              'jwtToken.createdAt': {
                error: 'This data field does not exist in the contract storage',
              },
              requesterAddress: {
                error: 'This data field does not exist in the contract storage',
              },
            },
          },
        ],
        organizations: [
          {
            key: {
              address: testAccount2,
              jwtToken: 'jwt',
            },
            value: {
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
              name: 'toto',
              publicKey: 'toto public key',
              publicKeyHash: testAccount2,
            },
          },
          {
            key: {
              address: 'Fake address',
              jwtToken: 'jwt',
            },
            error: 'The current map does not contain this key',
          },
        ],
        accessRequests2: {
          error: 'This data field does not exist in the contract storage',
        },
      });
    });

    it('should correctly return the map value of a map which is inside another map', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        FA2Contract3,
      );

      await expect(
        convertStorage(
          logger,
          [
            {
              organizations: [
                {
                  key: {
                    address: testAccount2,
                    jwtToken: 'jwt',
                  },
                  dataFields: [
                    {
                      datasources: [
                        { key: 'datasource1' },
                        { key: 'datasource3' },
                      ],
                    },
                    'name',
                  ],
                },
                {
                  key: {
                    address: testAccount,
                    jwtToken: 'jwt',
                  },
                  dataFields: [
                    {
                      datasources: [
                        { key: 'datasource4' },
                        { key: 'datasource3' },
                      ],
                    },
                    'name',
                  ],
                },
              ],
            },
          ],
          storage,
        ),
      ).resolves.toEqual({
        organizations: [
          {
            key: {
              address: testAccount2,
              jwtToken: 'jwt',
            },
            value: {
              datasources: [
                {
                  key: 'datasource1',
                  value: 'value1',
                },
                {
                  key: 'datasource3',
                  value: 'value3',
                },
              ],
              name: 'toto',
            },
          },
          {
            key: {
              address: testAccount,
              jwtToken: 'jwt',
            },
            value: {
              datasources: [
                {
                  key: 'datasource4',
                  value: 'value4',
                },
                {
                  key: 'datasource3',
                  error: 'The current map does not contain this key',
                },
              ],
              name: 'tata',
            },
          },
        ],
      });
    });

    it('should correctly set error message if a data is not a map but request dataField is object', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        flexibleTokenContract,
      );

      await expect(
        convertStorage(
          logger,
          [
            {
              decimals: [
                {
                  key: {
                    address: testAccount2,
                    jwtToken: 'jwt',
                  },
                },
              ],
            },
          ],
          storage,
        ),
      ).resolves.toEqual({
        decimals: {
          error:
            'This data field does not have type MichelsonMap or BigMap, use simple string to access to the properties',
        },
      });
    });

    it('should correctly set error message if a data (which is in a deep object) is not a map but request dataField is object', async () => {
      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        FA2Contract3,
      );

      await expect(
        convertStorage(
          logger,
          [
            {
              organizations: [
                {
                  key: {
                    address: testAccount2,
                    jwtToken: 'jwt',
                  },
                  dataFields: [
                    {
                      datasources: [
                        { key: 'datasource1' },
                        { key: 'datasource3' },
                      ],
                    },
                    {
                      name: [{ key: 'datasource1' }],
                    },
                  ],
                },
              ],
            },
          ],
          storage,
        ),
      ).resolves.toEqual({
        organizations: [
          {
            key: {
              address: testAccount2,
              jwtToken: 'jwt',
            },
            value: {
              datasources: [
                {
                  key: 'datasource1',
                  value: 'value1',
                },
                {
                  key: 'datasource3',
                  value: 'value3',
                },
              ],
              name: {
                error:
                  'This data field does not have type MichelsonMap or BigMap, use simple string to access to the properties',
              },
            },
          },
        ],
      });
    });

    it('should throw and log error when unexpected error happened', async () => {
      const convertStorageValueToStorageResponseValueSpy = jest
        .spyOn(
          generateStorageResponseLib,
          'convertStorageValueToStorageResponseValue',
        )
        .mockImplementation(() => {
          throw new Error('Unexpected Error');
        });
      const loggerErrorSpy = jest.spyOn(logger, 'error');

      const storage = await getContractStorageFromTezosNode(
        logger,
        tezosService,
        flexibleTokenContract,
      );

      await expect(
        convertStorage(logger, ['decimals'], storage),
      ).rejects.toThrow(Error('Unexpected Error'));

      expect(convertStorageValueToStorageResponseValueSpy.mock.calls).toEqual([
        [new BigNumber(10)],
      ]);
      expect(loggerErrorSpy.mock.calls).toEqual([
        [
          { storage, dataFields: ['decimals'], message: 'Unexpected Error' },
          '[lib/storage/convert-storage/#convertStorage] Unexpected error while trying to form the storage response corresponding to the dataFields',
        ],
      ]);
    });
  });
});
