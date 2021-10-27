import { logger } from '../../services/logger';
import { ConfigurationResponse } from '../../const/interfaces/conf/conf-response';
import { IndexerPool } from '../../services/indexer-pool';
import { GatewayPool } from '../../services/gateway-pool';

/**
 * @description       - Get the loaded configuration
 * @return  {Object}
 */
export function getConfiguration(
  indexerPool: IndexerPool,
  gatewayPool: GatewayPool,
): ConfigurationResponse {
  try {
    const tezosNodesURLs = gatewayPool.tezosNodeUrls;
    const tezosIndexers = indexerPool.indexers.map((i) => ({
      name: i.config.name,
      URL: i.config.apiUrl,
    }));

    return { tezosNodesURLs, tezosIndexers };
  } catch (err) {
    logger.error(
      { error: err },
      '[lib/conf/getConfiguration] Unexpected error happened',
    );

    throw err;
  }
}
