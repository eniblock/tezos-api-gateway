import { Router } from 'express';

import contractController from './contract-controller';
import { IndexerPool } from '../../../../services/indexer-pool';

/**
 * Setup contract namespace route.
 *
 * @param   {Router} router       - The express router.
 * @param   {object} indexerPool  - The indexer pool
 * @returns {void}
 */
export default function registerContractRoutes(
  router: Router,
  indexerPool: IndexerPool,
): Router {
  router.get(
    '/contract/:contract_address/calls',
    contractController.getTransactionListOfSC(indexerPool),
  );

  return router;
}
