import { PostgreConfig } from '../../../src/const/interfaces/postgre-config';
import { AmqpConfig } from '../../../src/services/amqp';
import { VaultClientConfig } from '../../../src/services/clients/vault-client';

export const postgreConfig: PostgreConfig = {
  user: process.env.DB_USERNAME_TEST || 'tezos-service',
  host: process.env.DB_HOST_TEST || 'localhost',
  database: process.env.DB_NAME_TEST || 'tezos_api_gateway_test',
  password: process.env.DB_PWD_TEST || 'randompwd',
  port: parseInt(process.env.DB_PORT_TEST as string, 10) || 5432,
};

export const serverConfig = {
  port: 5555,
};

export const tezosNodeGranadaUrl =
  process.env.TEZOS_NODE_EDONET_TEST || 'https://granadanet.smartpy.io/';

export const tezosNodeGranadaUrls = (
  process.env.TEZOS_NODE_EDONET_TEST_URLS ||
  'https://api.tez.ie/rpc/granadanet,https://granadanet.smartpy.io/'
)
  //'https://testnet-tezos.giganode.io,https://api.tez.ie/rpc/granadanet,https://granadanet.smartpy.io/'
  .split(',');

export const amqpConfig: AmqpConfig = {
  url: process.env.AMQP_URL || 'amqp://localhost',
  queues: 'test',
  reconnectTimeoutInMs: 3000,
};

export const vaultClientConfig: VaultClientConfig = {
  apiUrl: 'http://localhost:8200',
  token: 'fake_token',
};

export const tezosPrivateKey =
  process.env.TEZOS_PRIVATE_KEY ||
  'edskRp4HS1SHZAi7hyj3PtwXHZWzf5Hb3XqrTPRzfX5JtjM5YvMiPsRRzzyc15pTmJRdE9t8p4NLu4agQ3izTRjuoy2HMZmWSL';
