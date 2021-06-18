import { PatchJobParams } from '../../../../const/interfaces/patch-job-params';
import { PostgreService } from '../../../../services/postgre';
import { GatewayPool } from '../../../../services/gateway-pool';
import { injectOperation } from '../../../../lib/jobs/inject-operation';
import { AmqpService } from '../../../../services/amqp';

export function createHandler(
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  amqpService: AmqpService,
) {
  return async (parameter: PatchJobParams) => {
    await injectOperation({ gatewayPool, postgreService, amqpService }, parameter);
  };
}
