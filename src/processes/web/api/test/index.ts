import { Router } from 'express';

import testController from './test-controller';

/**
 * Setup test namespace route.
 *
 * @param   {Router} router       - The express router.
 * @returns {void}
 */
export default function registerTestRoutes(router: Router): Router {
  router.post('/test/inMemorySigner', testController.sign());

  return router;
}
