import { Application, Router } from 'express';

import contractController from './contract-controller';
import { IndexerPool } from '../../../../services/indexer-pool';
import getEventsController from './get-contract-events-controller';

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

  router.get(
    '/contract/events',
    getEventsController.getContractEvents(indexerPool) as Application,
  );
  return router;
}
