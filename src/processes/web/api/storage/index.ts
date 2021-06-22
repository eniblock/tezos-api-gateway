import { Application, Router } from 'express';

import retrieveContractStorage from './retrieve-contract-storage-controller';
import { GatewayPool } from '../../../../services/gateway-pool';
import deployContractStorage from './deploy-contract-storage-controller';

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

  router.post(
    '/tezos_node/contract/deploy',
    deployContractStorage.compileAndDeployContract(gatewayPool) as Application,
  );

  return router;
}
