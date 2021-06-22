import { Application, Router } from 'express';

import forgeJobController from './forge-job-controller';
import injectJobController from './inject-job-controller';
import sendJobController from './send-job-controller';
import deployJobController from './deploy-job-controller';
import { PostgreService } from '../../../../services/postgre';
import { AmqpService } from '../../../../services/amqp';
import { GatewayPool } from '../../../../services/gateway-pool';

/**
 * Setup jobs namespace route.
 *
 * @param   {Router} router The express router.
 * @returns {void}
 */
export default function registerJobsRoutes(
  router: Router,
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  amqpService: AmqpService,
): Router {
  router.post(
    '/forge/jobs',
    forgeJobController.forgeOperationAndCreateJob(
      gatewayPool,
      postgreService,
    ) as Application,
  );

  router.patch(
    '/inject/jobs',
    injectJobController.injectOperationAndUpdateJob(
      postgreService,
      amqpService,
    ) as Application,
  );

  router.post(
    '/send/jobs',
    sendJobController.sendTransactionsAndCreateJob(
      amqpService,
      postgreService,
    ) as Application,
  );

  router.post(
    '/deploy/jobs',
    deployJobController.compileAndDeployContract(gatewayPool) as Application,
  );

  return router;
}
