import { InjectionConsumerProcess } from './injection-consumer-process';
import { createLogger } from '../../../services/logger';
import { injectionWorkerLoggerConfig } from './config';

if (!module.parent) {
  const logger = createLogger(injectionWorkerLoggerConfig);

  const injectionConsumerProcess = new InjectionConsumerProcess(logger);

  injectionConsumerProcess.spawn();
}
