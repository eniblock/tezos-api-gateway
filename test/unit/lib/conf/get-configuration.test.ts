import { logger } from '../../../__fixtures__/services/logger';
import { getConfiguration } from '../../../../src/lib/conf/get-configuration';
import { GatewayPool } from '../../../../src/services/gateway-pool';
import { IndexerPool } from '../../../../src/services/indexer-pool';
import { indexerConfigs, tezosNodeUrls } from '../../../../src/config';

describe('[lib/conf] Get configuration', () => {
  let indexerPool: IndexerPool;
  let gatewayPool: GatewayPool;

  beforeAll(async () => {
    indexerPool = new IndexerPool(logger);
    gatewayPool = new GatewayPool(tezosNodeUrls, logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getConfiguration', () => {
    it('should return the same number of nodes and indexer as in the conf', async () => {
      await indexerPool.initializeIndexers();
      const { tezosNodesURLs, tezosIndexers } = getConfiguration(
        indexerPool,
        gatewayPool,
      );

      expect(tezosNodesURLs.length).toEqual(tezosNodeUrls.length);
      expect(tezosIndexers.length).toEqual(indexerConfigs.length);
    });
  });
});
