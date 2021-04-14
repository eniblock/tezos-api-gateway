import * as cron from 'cron';

import { createLogger } from '../../../services/logger';
import { cronTime, loggerConfig } from './config';
import { CheckOperationStatusProcess } from './check-operation-status-process';

const job = new cron.CronJob(cronTime, async () => {
  const logger = createLogger(loggerConfig);

  const checkOperationStatus = new CheckOperationStatusProcess(logger);

  await checkOperationStatus.spawn();
});

job.start();
