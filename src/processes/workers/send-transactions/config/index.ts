import { AmqpConfig } from '../../../../services/amqp';
import { ExchangeType } from '../../../../const/exchange-type';
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
  exchange: {
    name: process.env.SEND_TRANSACTIONS_QUEUE_EXCHANGE || 'topic_logs',
    type:
      (process.env.SEND_TRANSACTIONS_QUEUE_EXCHANGE_TYPE as ExchangeType) ||
      ExchangeType.topic,
  },
  routingKey:
    process.env.SEND_TRANSACTIONS_WORKER_QUEUE_ROUTING_KEY ||
    'send_transactions.*',
};
