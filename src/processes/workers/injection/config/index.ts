import { ProcessConfig } from '../../../abstract-process';
import { parseInt } from '../../../../utils/parse-int';

export const injectionWorkerProcessConfig: ProcessConfig = {
  name: process.env.INJECTION_WORKER_NAME || 'Injection Worker',
  exitTimeout: parseInt(3000, process.env.INJECTION_WORKER_TIMEOUT),
};

export const injectionWorkerLoggerConfig = {
  name: process.env.LOGGER_NAME || 'InjectionWorker',
  level: process.env.LOGGER_LEVEL || 'info',
};
