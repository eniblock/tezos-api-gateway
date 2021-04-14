import { Application as ExpressApp, Router as createRouter } from 'express';

import registerStorageRoutes from '../../web/api/storage';
import registerEntryPointsRoutes from '../../web/api/entrypoints';
import registerRoutes from './controllers';

import { PostgreService } from '../../../services/postgre';
import { AmqpService } from '../../../services/amqp';
import { GatewayPool } from '../../../services/gateway-pool';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';

export default function setupRoutes(
  app: ExpressApp,
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  amqpService: AmqpService,
  forgeAndSendPathObject: OpenAPIV3.PathsObject,
): ExpressApp {
  const router = createRouter();

  registerRoutes(
    router,
    gatewayPool,
    postgreService,
    amqpService,
    forgeAndSendPathObject,
  );
  registerStorageRoutes(router, gatewayPool);
  registerEntryPointsRoutes(router, gatewayPool);

  app.use('/api', router);

  return app;
}
