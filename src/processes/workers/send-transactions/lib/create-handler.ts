import * as Logger from 'bunyan';

import { PostgreService } from '../../../../services/postgre';
import { sendTransactions } from '../../../../lib/jobs/send-transactions';
import { SendTransactionsToQueueParams } from '../../../../const/interfaces/send-transactions-params';
import { GatewayPool } from '../../../../services/gateway-pool';

export function createHandler(
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  logger: Logger,
) {
  return async (parameter: SendTransactionsToQueueParams) => {
    await sendTransactions(parameter, gatewayPool, postgreService, logger);
  };
}
