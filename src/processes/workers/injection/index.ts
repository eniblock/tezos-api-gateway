import { InjectionConsumerProcess } from './injection-consumer-process';
import { createLogger } from '../../../services/logger';
import { injectionWorkerLoggerConfig } from './config';

(async () => {
  const logger = createLogger(injectionWorkerLoggerConfig);

  const injectionConsumerProcess = new InjectionConsumerProcess(logger);

  await injectionConsumerProcess.spawn();
})();
