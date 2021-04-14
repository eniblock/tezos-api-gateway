import { createLogger } from '../../../services/logger';
import { SendTransactionsConsumerProcess } from './send-transactions-consumer-process';
import { sendTransactionsWorkerLoggerConfig } from './config';

if (!module.parent) {
  const logger = createLogger(sendTransactionsWorkerLoggerConfig);

  const injectionConsumerProcess = new SendTransactionsConsumerProcess(logger);

  injectionConsumerProcess.spawn();
}
