import { Application, Router } from 'express';

import { GatewayPool } from '../../../../services/gateway-pool';
import retrieveEntrypointsSchema from './retrieve-entrypoint-schema-controller';
import setQueryParams from '../../middleware/set-query-params';

/**
 * Setup entrypoints namespace route.
 *
 * @param   {Router} router        - The express router.
 * @param   {object} gatewayPool  - the service to interact with tezos
 * @returns {void}
 */
export default function registerEntryPointsRoutes(
  router: Router,
  gatewayPool: GatewayPool,
): Router {
  router.get(
    '/entrypoints/:contract_address',
    setQueryParams,
    retrieveEntrypointsSchema.retrieveEntryPointsSchemaFromTezosNode(
      gatewayPool,
    ) as Application,
  );

  return router;
}
