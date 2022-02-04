import { Router } from 'express';

import testController from './test-controller';
import { GatewayPool } from '../../../../services/gateway-pool';

/**
 * Setup test namespace route.
 *
 * @param   {Router} router       - The express router.
 * @returns {void}
 */
export default function registerTestRoutes(
  router: Router,
  gatewayPool: GatewayPool,
): Router {
  router.post('/test/inMemorySigner', testController.signInMemory());
  router.post('/test/vaultSigner', testController.signWithVault());
  router.post('/test/packData', testController.packMichelsonData(gatewayPool));

  return router;
}
