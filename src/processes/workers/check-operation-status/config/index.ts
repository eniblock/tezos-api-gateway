import { AmqpConfig } from '../../../../services/amqp';
import { ExchangeType } from '../../../../const/exchange-type';
import { ProcessConfig } from '../../../abstract-process';
import { parseInt } from '../../../../utils/parse-int';

export const checkOperationStatusProcess: ProcessConfig = {
  name:
    process.env.CHECK_OPERATION_STATUS_WORKER_NAME ||
    'Check Operation Status Worker',
  exitTimeout: parseInt(
    3000,
    process.env.CHECK_OPERATION_STATUS_WORKER_TIMEOUT,
  ),
};

export const loggerConfig = {
  name: process.env.LOGGER_NAME || 'Check Operation Status Worker',
  level: process.env.LOGGER_LEVEL || 'info',
};

export const amqpConfig: AmqpConfig = {
  url: process.env.AMQP_URL || 'amqp://localhost',
  exchange: {
    name: process.env.PUBLISH_EVENT_EXCHANGE || 'headers-exchange',
    type:
      (process.env.PUBLISH_EVENT_EXCHANGE_TYPE as ExchangeType) ||
      ExchangeType.headers,
  },
  reconnectTimeoutInMs: parseInt(3000, process.env.RECONNECT_TIMEOUT),
};

export const cronTime =
  process.env.CHECK_OPERATION_STATUS_CRON_TIME || '* * * * *';
