import { ProcessConfig } from '../../../abstract-process';
import { parseInt } from '../../../../utils/parse-int';
import { AmqpConfig } from '../../../../services/amqp';

export const injectionWorkerProcessConfig: ProcessConfig = {
  name: process.env.INJECTION_WORKER_NAME || 'Injection Worker',
  exitTimeout: parseInt(3000, process.env.INJECTION_WORKER_TIMEOUT),
};

export const injectionWorkerLoggerConfig = {
  name: process.env.LOGGER_NAME || 'Injection Worker',
  level: process.env.LOGGER_LEVEL || 'info',
};

export const amqpConfig: AmqpConfig = {
  url: process.env.AMQP_URL || 'amqp://localhost',
  queues: process.env.AMQP_QUEUE_NAME || 'inject-transaction',
};
