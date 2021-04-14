import { Application, Router } from 'express';

import forgeJobController from './forge-job-controller';
import injectJobController from '../../../web/api/jobs/inject-job-controller';
import sendJobController from './send-job-controller';
import { PostgreService } from '../../../../services/postgre';
import { AmqpService } from '../../../../services/amqp';
import { GatewayPool } from '../../../../services/gateway-pool';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import { extractForgeAndSendTransactionsPaths } from '../../../../helpers/extract-arrays';

/**
 * Setup namespace route.
 *
 * @param   {Router} router The express router.
 * @returns {void}
 */
export default function registerRoutes(
  router: Router,
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  amqpService: AmqpService,
  forgeAndSendPathObject: OpenAPIV3.PathsObject,
): Router {
  const { forgePaths, sendPaths } = extractForgeAndSendTransactionsPaths(
    forgeAndSendPathObject,
  );

  forgePaths.forEach((path) => {
    router.post(
      path,
      forgeJobController.forgeOperationAndCreateJob(
        gatewayPool,
        postgreService,
      ) as Application,
    );
  });

  sendPaths.forEach((path) => {
    router.post(
      path,
      sendJobController.sendTransactionsAndCreateJob(
        amqpService,
        postgreService,
      ) as Application,
    );
  });

  router.patch(
    '/inject',
    injectJobController.injectOperationAndUpdateJob(
      postgreService,
      amqpService,
    ) as Application,
  );

  return router;
}
