# TEZOS API GATEWAY

## Introduction

This is a project to build APIs to easily interact with Tezos blockchain. This project currently contains the following APIs:

- An API to **_forge transactions_**
- An API to **_injection transactions_**
- An API to **_send transactions_** (forge, sign, pre-apply and inject in one step)
- An API to **_get all the entry points_** and **_parameters schema of contract_**
- An API to **_get the contract storage_**, also allows **_getting partial part of contract storage_**
  or **_deep dive into a Map/Complex Object_**.

To handle a load of requests for Injection and Send Transactions API, it also **_implements the usage of RabbitMq_**.
By saying, it has services to consume the messages pushed to RabbitMq such as **_Send Transactions Worker_** and **_Injection Worker_**.

In addition, it also has a worker to check the status of operation hashes
(which are formed by using injection API or send transactions API of Tezos API Gateway),
to see if it is confirmed or not.

To understand more about the project, please visit the **[Grant Documentation][10]**.

## Services

**1. [Generic API Web Server][1]**

**2. [Generated API Web Server][2]**

**3. [Injection Worker][3]**

**4. [Send Transactions Worker][4]**

**5. [Check Operation Status Worker][5]**

## Development guide

This is a **_Node.js/Typescript_** project so **npm** should already be installed.

**Docker and docker compose** should also be installed to run some docker containers.

### Workflow
Check the project workflow [here][6].

### Development helpers

**1. [Create Vault Keys and Activate Corresponding Tezos Account][11]**

**2. [Sign a forged operation using Inmemory Signer][12]**

### How to use storage API
Check the guideline to use the API to retrieve contract storage [here][13].

### Install all dependencies

```
npm i
```

### Install dev dependencies

```
npm i -g bunyan nodemon
```

### Run unit tests and integration tests

<u>**_NOTES_**</u>: Please make sure that in the postgres databases server, there is a test database (by default it is **tezos_api_gateway_test**)

**Run all the check (ts-lint and prettier)**

```
npm run test
```

**Run only the tests**

```
npm run jest
```

**Run only one test**

```
npm run jest {path_to_test_file}
```

### Format the code to match ts-lint and prettier style

```
npm run prettier:write
```

### Environment variables

| Name                                       | Default Value                                            | Explaination                                                 |
| ------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------ |
| AMQP_URL                                   | amqp://localhost                                         | The url to link to rabbiMq server                            |
| AMQP_QUEUE_NAME                            | injection                                                | The name of the queue to send injection message              |
| CONTRACT_ADDRESS                           | KT1Nk7KLuuWJz8muPN1hFZhFtneepKNAsJSU                     | The smart contract address used for Generated API Web server |
| DB_HOST                                    | localhost-service                                        | The database host                                            |
| DB_NAME                                    | tezos_api_gateway                                        | The database name                                            |
| DB_PORT                                    | 5432                                                     | The port to connect to database                              |
| DB_PWD                                     | randompwd                                                | The password to connect to database                          |
| DB_USERNAME                                | tezos-service                                            | The user name to connect to database                         |
| LOGGER_NAME                                | TezosApiGateway                                          | The name of the logger                                       |
| LOGGER_LEVEL                               | info                                                     | The level of the logger                                      |
| WEB_PROCESS_NAME                           | Tezos Api Gateway                                        | The name of the process                                      |
| WEB_PROCESS_TIMEOUT                        | 3000                                                     | The process timeout in milliseconds                          |
| SEND_TRANSACTIONS_QUEUE_EXCHANGE           | topic_logs                                               | The exchange name that the queue should be formed by         |
| SEND_TRANSACTIONS_QUEUE_EXCHANGE_TYPE      | topic                                                    | The exchange type                                            |
| SEND_TRANSACTIONS_WORKER_QUEUE_ROUTING_KEY | send_transactions.\*                                     | The routing key that the queue will be formed by             |
| TEZOS_NODE_URLS                            | https://api.tez.ie/rpc/edonet,https://edonet.smartpy.io/ | List of Tezos Node Urls, separated by comma `,`              |
| VAULT_URL                                  | http://localhost:8300/v1/                                | The vault server URL                                         |
| VAULT_TOKEN                                | myroot                                                   | The api token to access Vault server                         |

**Indexer Environment Variables**

| Name                           | Default Value                                                                         | Explaination                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| BETTER_CALL_URL                | https://better-call.dev/v1/opg/                                                       | The Better Call API Url to retrieve information about an operation       |
| BETTER_CALL_KEY_TO_OPERATION   | 0                                                                                     | The object key or array index to get the the information of an operation |
| BETTER_CALL_KEY_TO_BLOCK_LEVEL | level                                                                                 | The object key representing the block level                              |
| CONSEIL_URL                    | https://conseil-edo.cryptonomic-infra.tech:443/v2/data/tezos/edonet/operation_groups/ | The Conseil API Url to retrieve information about an operation           |
| CONSEIL_KEY_TO_OPERATION       | operation_group                                                                       | The object key or array index to get the the information of an operation |
| CONSEIL_KEY_TO_BLOCK_LEVEL     | blockLevel                                                                            | The object key representing the block level                              |
| CONSEIL_API_KEY                | 503801e8-a8a0-4e7c-8c24-7bd310805843                                                  | The api key to access the Conseil Indexer                                |
| TZSTATS_URL                    | https://api.edo.tzstats.com/explorer/op/                                              | The Tzstat API Url to retrieve information about an operation            |
| TZSTATS_KEY_TO_OPERATION       | 0                                                                                     | The object key or array index to get the the information of an operation |
| TZSTATS_KEY_TO_BLOCK_LEVEL     | height                                                                                | The object key representing the block level                              |
| TZKT_URL                       | https://api.edo2net.tzkt.io/v1/operations/                                            | The Tzkt API Url to retrieve information about an operation              |
| TZKT_KEY_TO_OPERATION          | 0                                                                                     | The object key or array index to get the the information of an operation |
| TZKT_KEY_TO_BLOCK_LEVEL        | level                                                                                 | The object key representing the block level                              |

**Test Environment Variables**

| Name                        | Default Value                                            | Explaination                                    |
| --------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| AMQP_URL                    | amqp://localhost                                         | The url to link to rabbiMq server               |
| DB_HOST_TEST                | localhost-service                                        | The database host                               |
| DB_NAME_TEST                | tezos_api_gateway                                        | The database name                               |
| DB_PORT_TEST                | 5432                                                     | The port to connect to database                 |
| DB_PWD_TEST                 | randompwd                                                | The password to connect to database             |
| DB_USERNAME_TEST            | tezos-service                                            | The user name to connect to database            |
| TEZOS_NODE_EDONET_TEST      | https://api.tez.ie/rpc/edonet                            | A Tezos Node URL                                |
| TEZOS_NODE_EDONET_TEST_URLS | https://api.tez.ie/rpc/edonet,https://edonet.smartpy.io/ | List of Tezos Node Urls, separated by comma `,` |

## Kubernetes Installation

### Cert manager
```shell
kubectl create namespace cert-manager
helm repo add jetstack https://charts.jetstack.io

helm install cert-manager jetstack/cert-manager --namespace cert-manager --version v1.2.0 --create-namespace --set installCRDs=true
```

Create gitlab registry secret
```shell script
kubectl create secret docker-registry gitlab-registry --docker-server=registry.gitlab.com --docker-username=DOCKER_USER --docker-password=DOCKER_PASSWORD --docker-email=DOCKER_EMAIL
```

### Tezos API Gateway
```shell
helm install tezos-api-gateway ./helm/tezos-api-gateway --values ./helm/tezos-api-gateway/values-dev.yaml
```

[1]: src/processes/web/README.md
[2]: src/processes/generated-api-web/README.md
[3]: src/processes/workers/injection/README.md
[4]: src/processes/workers/send-transactions/README.md
[5]: src/processes/workers/check-operation-status/README.md
[6]: docs/workflow.md
[7]: workflow-diagrams/Forge%20and%20injection.png
[8]: workflow-diagrams/Send%20transaction%20sequence.png
[9]: workflow-diagrams/Check%20operation%20status%20process.png
[10]: docs/tezos-grant.md
[11]: src/scripts/activate-tezos-account/README.md
[12]: src/scripts/sign-transaction-with-InMemorySigner/README.md
[13]: docs/retrieve-contract-storage.md
