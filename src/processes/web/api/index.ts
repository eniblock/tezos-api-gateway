import { Application as ExpressApp, Router as createRouter } from 'express';

import registerJobsRoutes from './jobs';
import registerStorageRoutes from './storage';
import { PostgreService } from '../../../services/postgre';
import { AmqpService } from '../../../services/amqp';
import { GatewayPool } from '../../../services/gateway-pool';
import registerEntryPointsRoutes from './entrypoints';
import registerUserRoutes from './user';
import { SignerFactory } from '../../../services/signer-factory';

export default function setupRoutes(
  app: ExpressApp,
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  amqpService: AmqpService,
  signerFactory: SignerFactory,
): ExpressApp {
  const router = createRouter();

  registerJobsRoutes(router, gatewayPool, postgreService, amqpService);
  registerStorageRoutes(router, gatewayPool, signerFactory);
  registerEntryPointsRoutes(router, gatewayPool);
  registerUserRoutes(router, gatewayPool);

  app.use('/api', router);

  return app;
}
