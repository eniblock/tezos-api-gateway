import { Application, Router } from 'express';

import forgeJobController from './forge-job-controller';
import estimateJobController from './estimate-job-controller';
import forgeRevealJobController from './forge-reveal-job-controller';
import injectJobController from './inject-job-controller';
import sendJobController from './send-job-controller';
import { PostgreService } from '../../../../services/postgre';
import { AmqpService } from '../../../../services/amqp';
import { GatewayPool } from '../../../../services/gateway-pool';
import getJobController from './get-job-controller';
import { MetricPrometheusService } from '../../../../services/metric-prometheus';
import setQueryParams from '../../middleware/set-query-params';

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
  metricPrometheusService: MetricPrometheusService,
): Router {
  router.post(
    '/forge/jobs',
    forgeJobController.forgeOperationAndCreateJob(
      gatewayPool,
      postgreService,
    ) as Application,
  );

  router.post(
    '/forge/reveal',
    forgeRevealJobController.forgeRevealOperationAndCreateJob(
      gatewayPool,
      postgreService,
    ) as Application,
  );

  router.patch(
    '/inject/jobs',
    setQueryParams,
    injectJobController.injectOperationAndUpdateJob(
      postgreService,
      gatewayPool,
    ) as Application,
  );

  router.patch(
    '/async/inject/jobs',
    setQueryParams,
    injectJobController.injectOperationAndUpdateJobAsync(
      postgreService,
      amqpService,
    ) as Application,
  );

  router.post(
    '/send/jobs',
    setQueryParams,
    sendJobController.sendTransactionsAndCreateJob(
      gatewayPool,
      postgreService,
      metricPrometheusService,
    ) as Application,
  );

  router.post(
    '/async/send/jobs',
    setQueryParams,
    sendJobController.sendTransactionsAndCreateJobAsync(
      amqpService,
      postgreService,
      metricPrometheusService,
    ) as Application,
  );

  router.get(
    '/job/:id',
    getJobController.getJobById(postgreService) as Application,
  );

  router.get(
    '/job/caller-id/:callerId',
    getJobController.getJobsByCallerId(postgreService) as Application,
  );

  router.post(
    '/estimate/jobs',
    estimateJobController.estimateOperation(gatewayPool) as Application,
  );

  return router;
}
