import { PostgreConfig } from '../const/interfaces/postgre-config';
import { AmqpConfig } from '../services/amqp';
import { ProcessConfig } from '../processes/abstract-process';
import { parseInt } from '../utils/parse-int';
import { IndexerConfig, IndexerEnum } from '../const/interfaces/indexer';
import { MetricConfig } from '../const/interfaces/metric-config';
import { flexibleTokenContract } from '../../test/__fixtures__/smart-contract';

export const prod: boolean = (process.env.PROD + '').toUpperCase() !== 'FALSE';

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
  'https://ghostnet.tezos.marigold.dev/,https://ghostnet.smartpy.io/,https://ghostnet.ecadinfra.com	/'
).split(',');

export const amqpConfig: AmqpConfig = {
  url: process.env.AMQP_URL || 'amqp://localhost',
  queues: process.env.AMPQ_QUEUES || 'inject-transaction send-transaction',
};

export const webProcessConfig: ProcessConfig = {
  name: process.env.WEB_PROCESS_NAME || 'Tezos Api Gateway',
  exitTimeout: parseInt(3000, process.env.WEB_PROCESS_TIMEOUT),
};

// export const tzstatsIndexerConfig: IndexerConfig = {
//   name: IndexerEnum.TZSTATS,
//   apiUrl: process.env.TZSTATS_URL || 'https://api.ghost.tzstats.com/',
//   pathToOperation: 'explorer/op/',
//   pathToUserInfo: 'explorer/account/',
//   pathToContractCalls: 'explorer/contract/',
//   keyToOperation: parseInt(0, process.env.TZSTATS_KEY_TO_OPERATION),
//   keyToBlockLevel: process.env.TZSTATS_KEY_TO_BLOCK_LEVEL || 'height',
//   keyToOperationStatus: 'status',
//   successStatus: 'applied',
//   keyToBalance: 'spendable_balance',
//   balanceUnit: 1,
//   keyToReveal: 'is_revealed',
//   keyToCreationDate: 'time',
// };

export const tzktIndexerConfig: IndexerConfig = {
  name: IndexerEnum.TZKT,
  apiUrl: process.env.TZKT_URL || 'https://api.ghostnet.tzkt.io/',
  pathToOperation: 'v1/operations/',
  pathToContractCalls: 'v1/operations/transactions/',
  pathToTokenBalance: 'v1/tokens/balances/',
  pathToEvents: 'v1/contracts/events/',
  pathToUserInfo: 'v1/accounts/',
  keyToOperation: parseInt(0, process.env.TZKT_KEY_TO_OPERATION),
  keyToBlockLevel: process.env.TZKT_KEY_TO_BLOCK_LEVEL || 'level',
  keyToOperationStatus: 'status',
  successStatus: 'applied',
  keyToBalance: 'balance',
  balanceUnit: 1000000,
  keyToReveal: 'revealed',
  keyToCreationDate: 'timestamp',
};

export const indexerConfigs: IndexerConfig[] = [
  // tzstatsIndexerConfig,
  tzktIndexerConfig,
];

export const nbOfConfirmation = parseInt(
  1,
  process.env.NUMBER_OF_OPERATION_CONFIRMATION,
);

export const operationExpirationTimeoutInMinutes = parseInt(
  8,
  process.env.OPERATION_EXPIRATION_TIMEOUT_IN_MINUTES,
);

export const nbOfRetry = parseInt(3, process.env.NUMBER_OF_INDEXERS_RETRY);

export const vaultClientConfig = {
  apiUrl: process.env.VAULT_URL || 'http://localhost:8300/v1/',
  token: process.env.VAULT_TOKEN || 'myroot',
};

export const contractAddress =
  process.env.CONTRACT_ADDRESS || flexibleTokenContract; // flexibleToken.py

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

export const maxOperationsPerBatch = 5;
export const gasLimitMargin = 100;
