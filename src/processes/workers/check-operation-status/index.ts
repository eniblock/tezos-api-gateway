import { createLogger } from '../../../services/logger';
import { loggerConfig } from './config';
import { CheckOperationStatusProcess } from './check-operation-status-process';

(async () => {
  const logger = createLogger(loggerConfig);

  const checkOperationStatus = new CheckOperationStatusProcess(logger);
  await checkOperationStatus.spawn();
})();
