import { PostgreConfig } from '../const/interfaces/postgre-config';
import { AmqpConfig } from '../services/amqp';
import { ProcessConfig } from '../processes/abstract-process';
import { parseInt } from '../utils/parse-int';
import { IndexerConfig } from '../const/interfaces/indexer-config';
import { ExchangeType } from '../const/exchange-type';

export const loggerConfig = {
  name: process.env.LOGGER_NAME || 'TezosApiGateway',
  level: process.env.LOGGER_LEVEL || 'info',
};

export const postgreConfig: PostgreConfig = {
  user: process.env.DB_USERNAME || 'tezos-service',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tezos_api_gateway',
  password: process.env.DB_PWD || 'randompwd',
  port: parseInt(5432, process.env.DB_PORT),
};

export const serverConfig = {
  port: parseInt(3333, process.env.PORT),
};

export const tezosNodeUrls = (
  process.env.TEZOS_NODE_URLS ||
  'https://api.tez.ie/rpc/edonet,https://edonet.smartpy.io/'
).split(',');

export const amqpConfig: AmqpConfig = {
  url: process.env.AMQP_URL || 'amqp://localhost',
  queueName: process.env.AMQP_QUEUE_NAME || 'injection',
  exchange: {
    name: process.env.SEND_TRANSACTIONS_QUEUE_EXCHANGE || 'topic_logs',
    type:
      (process.env.SEND_TRANSACTIONS_QUEUE_EXCHANGE_TYPE as ExchangeType) ||
      ExchangeType.topic,
  },
  routingKey:
    process.env.SEND_TRANSACTIONS_QUEUE_ROUTING_KEY || 'send_transactions',
};

export const webProcessConfig: ProcessConfig = {
  name: process.env.WEB_PROCESS_NAME || 'Tezos Api Gateway',
  exitTimeout: parseInt(3000, process.env.WEB_PROCESS_TIMEOUT),
};

const tzstatsIndexerConfig: IndexerConfig = {
  name: 'tzstats',
  apiUrl: process.env.TZSTATS_URL || 'https://api.edo.tzstats.com/explorer/op/',
  keyToOperation: parseInt(0, process.env.TZSTATS_KEY_TO_OPERATION),
  keyToBlockLevel: process.env.TZSTATS_KEY_TO_BLOCK_LEVEL || 'height',
};

const tzktIndexerConfig: IndexerConfig = {
  name: 'tzkt',
  apiUrl: process.env.TZKT_URL || 'https://api.edo2net.tzkt.io/v1/operations/',
  keyToOperation: parseInt(0, process.env.TZKT_KEY_TO_OPERATION),
  keyToBlockLevel: process.env.TZKT_KEY_TO_BLOCK_LEVEL || 'level',
};

const betterCallIndexerConfig: IndexerConfig = {
  name: 'better-call',
  apiUrl: process.env.BETTER_CALL_URL || 'https://better-call.dev/v1/opg/',
  keyToOperation: parseInt(0, process.env.BETTER_CALL_KEY_TO_OPERATION),
  keyToBlockLevel: process.env.BETTER_CALL_KEY_TO_BLOCK_LEVEL || 'level',
};

const conseilIndexerConfig: IndexerConfig = {
  name: 'conseil',
  apiUrl:
    process.env.CONSEIL_URL ||
    'https://conseil-edo.cryptonomic-infra.tech:443/v2/data/tezos/edonet/operation_groups/',
  keyToOperation: process.env.CONSEIL_KEY_TO_OPERATION || 'operation_group',
  keyToBlockLevel: process.env.CONSEIL_KEY_TO_BLOCK_LEVEL || 'blockLevel',
  apiKey: process.env.CONSEIL_API_KEY || '503801e8-a8a0-4e7c-8c24-7bd310805843',
};

export const indexerConfigs = [
  tzstatsIndexerConfig,
  tzktIndexerConfig,
  betterCallIndexerConfig,
  conseilIndexerConfig,
];

export const nbOfConfirmation = parseInt(
  3,
  process.env.NUMBER_OF_OPERATION_CONFIRMATION,
);

export const nbOfRetry = parseInt(3, process.env.NUMBER_OF_INDEXERS_RETRY);

export const vaultClientConfig = {
  apiUrl: process.env.VAULT_URL || 'http://localhost:8300/v1/',
  token: process.env.VAULT_TOKEN || 'myroot',
};

export const contractAddress =
  process.env.CONTRACT_ADDRESS || 'KT1Nk7KLuuWJz8muPN1hFZhFtneepKNAsJSU';

export const transferAmount = parseInt(2, process.env.TRANSFER_AMOUNT);
