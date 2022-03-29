import { Router } from 'express';

import { GatewayPool } from '../../../../services/gateway-pool';
import utilsController from './utils-controller';

/**
 * Setup utils namespace route.
 * @param   {Router} router       - The express router.
 * @param gatewayPool
 * @returns {void}
 */
export default function registerUtilsRoutes(
  router: Router,
  gatewayPool: GatewayPool,
): Router {
  router.post(
    '/utils/pack-data',
    utilsController.packMichelsonData(gatewayPool),
  );

  return router;
}
