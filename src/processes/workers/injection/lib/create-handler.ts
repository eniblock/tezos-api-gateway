import { PatchJobParams } from '../../../../const/interfaces/patch-job-params';
import { PostgreService } from '../../../../services/postgre';
import { GatewayPool } from '../../../../services/gateway-pool';
import { injectOperation } from '../../../../lib/jobs/inject-operation';

export function createHandler(
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
) {
  return async (parameter: PatchJobParams) => {
    await injectOperation({ gatewayPool, postgreService }, parameter);
  };
}
