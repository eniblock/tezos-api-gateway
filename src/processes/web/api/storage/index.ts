import { Application, Router } from 'express';

import retrieveContractStorage from './retrieve-contract-storage-controller';
import { GatewayPool } from '../../../../services/gateway-pool';

/**
 * Setup storage namespace route.
 *
 * @param   {Router} router        - The express router.
 * @param   {object} tezosService  - the service to interact with tezos
 * @returns {void}
 */
export default function registerStorageRoutes(
  router: Router,
  gatewayPool: GatewayPool,
): Router {
  router.post(
    '/tezos_node/storage/:contract_address',
    retrieveContractStorage.retrieveContractStorageFromTezosNode(
      gatewayPool,
    ) as Application,
  );

  return router;
}
