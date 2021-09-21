import { AmqpConfig } from '../../../../services/amqp';
import { ProcessConfig } from '../../../abstract-process';
import { parseInt } from '../../../../utils/parse-int';

export const sendTransactionsWorkerProcessConfig: ProcessConfig = {
  name: process.env.SEND_TRANSACTION_WORKER_NAME || 'Send Transactions Worker',
  exitTimeout: parseInt(3000, process.env.SEND_TRANSACTION_WORKER_TIMEOUT),
};

export const sendTransactionsWorkerLoggerConfig = {
  name: process.env.LOGGER_NAME || 'Send Transactions Worker',
  level: process.env.LOGGER_LEVEL || 'info',
};

export const amqpConfig: AmqpConfig = {
  url: process.env.AMQP_URL || 'amqp://localhost',
  queues: process.env.AMQP_QUEUE_NAME || 'send-transaction',
  reconnectTimeoutInMs: parseInt(3000, process.env.RECONNECT_TIMEOUT),
};
