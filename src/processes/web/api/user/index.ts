import { Application, Router } from 'express';

import { GatewayPool } from '../../../../services/gateway-pool';
import createUserController from './create-user-controller';
import getUserController from './get-user-controller';

/**
 * Setup entrypoints namespace route.
 *
 * @param   {Router} router        - The express router.
 * @param   {object} gatewayPool  - the service to interact with tezos
 * @returns {void}
 */
export default function registerUserRoutes(
  router: Router,
  gatewayPool: GatewayPool,
): Router {
  router.get('/user', getUserController.getUser() as Application);

  router.post(
    '/user/create',
    createUserController.createUser(gatewayPool) as Application,
  );

  return router;
}
