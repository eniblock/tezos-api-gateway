import { Router } from 'express';

import confController from './conf-controller';
import { IndexerPool } from '../../../../services/indexer-pool';
import { GatewayPool } from '../../../../services/gateway-pool';

/**
 * Setup conf namespace route.
 *
 * @param   {Router} router       - The express router.
 * @param   {object} indexerPool  - The indexer pool
 * @returns {void}
 */
export default function registerConfRoutes(
  router: Router,
  indexerPool: IndexerPool,
  gatewayPool: GatewayPool,
): Router {
  router.get('/conf', confController.getConf(indexerPool, gatewayPool));

  return router;
}
