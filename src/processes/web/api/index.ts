import { Application as ExpressApp, Router as createRouter } from 'express';

import registerJobsRoutes from './jobs';
import registerStorageRoutes from './storage';
import { PostgreService } from '../../../services/postgre';
import { AmqpService } from '../../../services/amqp';
import { GatewayPool } from '../../../services/gateway-pool';
import registerEntryPointsRoutes from './entrypoints';
import registerUserRoutes from './user';
import registerContractRoutes from './contract';
import registerConfRoutes from './conf';
import { SignerFactory } from '../../../services/signer-factory';
import { MetricPrometheusService } from '../../../services/metric-prometheus';
import { IndexerPool } from '../../../services/indexer-pool';
import { prod } from '../../../config';
import registerTestRoutes from './test';
import registerUtilsRoutes from './utils';

export default function setupRoutes(
  app: ExpressApp,
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  amqpService: AmqpService,
  signerFactory: SignerFactory,
  metricPrometheusService: MetricPrometheusService,
  indexerPool: IndexerPool,
): ExpressApp {
  const router = createRouter();

  registerJobsRoutes(
    router,
    gatewayPool,
    postgreService,
    amqpService,
    metricPrometheusService,
  );
  registerStorageRoutes(router, gatewayPool, signerFactory);
  registerEntryPointsRoutes(router, gatewayPool);
  registerUserRoutes(router, gatewayPool, indexerPool);
  registerContractRoutes(router, indexerPool);
  registerConfRoutes(router, indexerPool, gatewayPool);
  registerUtilsRoutes(router, gatewayPool);

  if (!prod) {
    registerTestRoutes(router);
  }

  app.use('/api', router);

  return app;
}
