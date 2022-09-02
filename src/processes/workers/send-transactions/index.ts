import { createLogger } from '../../../services/logger';
import { SendTransactionsConsumerProcess } from './send-transactions-consumer-process';
import { sendTransactionsWorkerLoggerConfig } from './config';

(async () => {
  const logger = createLogger(sendTransactionsWorkerLoggerConfig);

  const sendTransactionsConsumerProcess = new SendTransactionsConsumerProcess(
    logger,
  );

  await sendTransactionsConsumerProcess.spawn();
})();
