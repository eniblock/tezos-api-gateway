import { PostgreConfig } from '../const/interfaces/postgre-config';
import { AmqpConfig } from '../services/amqp';
import { ProcessConfig } from '../processes/abstract-process';
import { parseInt } from '../utils/parse-int';
import { IndexerConfig } from '../const/interfaces/indexer-config';
import { ExchangeType } from '../const/exchange-type';
import { MetricConfig } from '../const/interfaces/metric-config';

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
  'https://florence-tezos.giganode.io,https://florencenet.smartpy.io,https://api.tez.ie/rpc/florencenet'
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
  apiUrl: process.env.TZSTATS_URL || 'https://api.florence.tzstats.com/',
  keyToOperation: parseInt(0, process.env.TZSTATS_KEY_TO_OPERATION),
  keyToBlockLevel: process.env.TZSTATS_KEY_TO_BLOCK_LEVEL || 'height',
  pathToOperation: 'explorer/op/',
  pathToUserInfo: 'explorer/account/',
  keyToBalance: 'total_balance',
  keyToReveal: 'is_revealed',
};

const tzktIndexerConfig: IndexerConfig = {
  name: 'tzkt',
  apiUrl: process.env.TZKT_URL || 'https://api.florencenet.tzkt.io/',
  keyToOperation: parseInt(0, process.env.TZKT_KEY_TO_OPERATION),
  keyToBlockLevel: process.env.TZKT_KEY_TO_BLOCK_LEVEL || 'level',
  pathToOperation: 'v1/operations/',
  pathToUserInfo: 'v1/accounts/',
  keyToReveal: 'revealed',
};

const betterCallIndexerConfig: IndexerConfig = {
  name: 'better-call',
  apiUrl: process.env.BETTER_CALL_URL || 'https://api.better-call.dev/',
  keyToOperation: parseInt(0, process.env.BETTER_CALL_KEY_TO_OPERATION),
  keyToBlockLevel: process.env.BETTER_CALL_KEY_TO_BLOCK_LEVEL || 'level',
  pathToOperation: 'v1/opg/',
  pathToUserInfo:
    process.env.BETTER_CALL_PATH_TO_USER_INFO || 'v1/account/florencenet/',
};

const conseilIndexerConfig: IndexerConfig = {
  name: 'conseil',
  apiUrl:
    process.env.CONSEIL_URL ||
    'https://conseil-florence.cryptonomic-infra.tech:443/',
  keyToOperation: process.env.CONSEIL_KEY_TO_OPERATION || 'operation_group',
  keyToBlockLevel: process.env.CONSEIL_KEY_TO_BLOCK_LEVEL || 'blockLevel',
  apiKey: process.env.CONSEIL_API_KEY || '503801e8-a8a0-4e7c-8c24-7bd310805843',
  pathToOperation:
    process.env.CONSEIL_PATH_TO_OPERATION ||
    'v2/data/tezos/florencenet/operation_groups/',
  pathToUserInfo:
    process.env.CONSEIL_PATH_TO_USER_INFO ||
    'v2/data/tezos/florencenet/accounts/',
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
  process.env.CONTRACT_ADDRESS || 'KT1LnJEtZttLAJeP45EzYvChAksRS1xE4hJ1';

export const transferAmount = parseInt(2, process.env.TRANSFER_AMOUNT);

export const compilationSmartpyConf = {
  commandPath: '/usr/local/smartpy/SmartPy.sh',
  contractDirectory: '/tmp',
  contractName: 'smartcontract.py',
};

export const metricConfig: MetricConfig = {
  port: 9464,
  preventServerStart: false,
  interval: 1000,
  meterName: 'prometheus-metrics',
};
