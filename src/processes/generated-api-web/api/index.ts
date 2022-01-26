import {
  Application,
  Application as ExpressApp,
  Router,
  Router as createRouter,
} from 'express';

import registerStorageRoutes from '../../web/api/storage';
import registerEntryPointsRoutes from '../../web/api/entrypoints';

import { PostgreService } from '../../../services/postgre';
import { AmqpService } from '../../../services/amqp';
import { GatewayPool } from '../../../services/gateway-pool';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import { SignerFactory } from '../../../services/signer-factory';
import { MetricPrometheusService } from '../../../services/metric-prometheus';
import { extractForgeAndSendTransactionsPaths } from '../../../helpers/extract-arrays';
import formatParametersToTransactionDetails from '../../web/middleware/format-parameters-to-transaction-details';
import forgeJobController from '../../web/api/jobs/forge-job-controller';
import sendJobController from '../../web/api/jobs/send-job-controller';
import injectJobController from '../../web/api/jobs/inject-job-controller';
import setQueryParams from '../../web/middleware/set-query-params';

export default function setupRoutes(
  app: ExpressApp,
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  amqpService: AmqpService,
  signerFactory: SignerFactory,
  metricPrometheusService: MetricPrometheusService,
  forgeAndSendPathObject: OpenAPIV3.PathsObject,
): ExpressApp {
  const router = createRouter();

  registerRoutes(
    router,
    gatewayPool,
    postgreService,
    amqpService,
    metricPrometheusService,
    forgeAndSendPathObject,
  );
  registerStorageRoutes(router, gatewayPool, signerFactory);
  registerEntryPointsRoutes(router, gatewayPool);

  app.use('/api', router);

  return app;
}

function registerRoutes(
  router: Router,
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  amqpService: AmqpService,
  metricPrometheusService: MetricPrometheusService,
  forgeAndSendPathObject: OpenAPIV3.PathsObject,
): Router {
  const { forgePaths, sendPaths, asyncSendPaths } =
    extractForgeAndSendTransactionsPaths(forgeAndSendPathObject);

  forgePaths.forEach((path) => {
    router.post(
      path,
      formatParametersToTransactionDetails,
      forgeJobController.forgeOperationAndCreateJob(
        gatewayPool,
        postgreService,
      ) as Application,
    );
  });

  sendPaths.forEach((path) => {
    router.post(
      path,
      setQueryParams,
      formatParametersToTransactionDetails,
      sendJobController.sendTransactionsAndCreateJob(
        gatewayPool,
        postgreService,
        metricPrometheusService,
      ) as Application,
    );
  });

  asyncSendPaths.forEach((path) => {
    router.post(
      path,
      setQueryParams,
      formatParametersToTransactionDetails,
      sendJobController.sendTransactionsAndCreateJobAsync(
        amqpService,
        postgreService,
        metricPrometheusService,
      ) as Application,
    );
  });

  router.patch(
    '/inject',
    setQueryParams,
    injectJobController.injectOperationAndUpdateJob(
      postgreService,
      gatewayPool,
    ) as Application,
  );

  router.patch(
    '/async/inject',
    setQueryParams,
    injectJobController.injectOperationAndUpdateJobAsync(
      postgreService,
      amqpService,
    ) as Application,
  );

  return router;
}
