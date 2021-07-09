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

The tests need postgresql and rabbitmq servers running and configured. Use the
provided docker-compose file to set up a test stack easily.

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
This application is meant to be deployed in a kubernetes cluster.

We assume that you already know what [kubernetes](https://kubernetes.io/) is and
how to have a production cluster. In addition, we assume you know how to use the
following tooling.
- [kubectl](https://kubernetes.io/docs/reference/kubectl/kubectl/) to control the cluster,
- [helm](https://helm.sh/) to deploy the tezos-api-gateway application (as a so-called chart),
- [k3d](https://k3d.io/) and [tilt](https://tilt.dev/) in case you want to have a development cluster,


We also assume you are at ease with installing an application with helm.

### Setup the development local stack

We don't know of a easy way to setup a comfortable kubernetes local stack. We
propose here two ways of doing so. Pick your favorite.

#### Using click-project

Internally, we use
[click-project](https://github.com/click-project/click-project) to automate
setting up the stack. This tool is not ready for production yet, so we provide a
more detailed setup in the next chapter. In case you want to give a shot to
click-project, here are the instructions.

First, make sure you have a recent enough version of python (at least 3.8).

On Ubuntu 18.04 for instance, it would look like this.

```
sudo apt install python3.8
```

Then, install click-project, along with the k8s extension.

```
curl -sSL https://raw.githubusercontent.com/click-project/click-project/master/install.sh | env CLK_RECIPES=https://github.com/click-project/clk_recipe_k8s/tarball/3e62739 bash
```

Then, simply run

```
clk k8s flow
```

#### Manually

You decided to follow the harder (but more stable) road of doing things manually? Here it is.

Install kubectl, helm, k3d and tilt using the following urls:

- https://github.com/rancher/k3d/releases/download/v4.4.4/k3d-linux-amd64
- https://get.helm.sh/helm-v3.6.0-linux-amd64.tar.gz
- https://dl.k8s.io/release/v1.21.1/bin/linux/amd64/kubectl
- https://github.com/tilt-dev/tilt/releases/download/v0.21.0/tilt.0.21.0.linux.x86_64.tar.gz

Then install a local registry with

```
k3d registry create registry.localhost -p 5000
```

Then create the k3d cluster with

```
k3d cluster create k3s-default --wait --port 80:80@loadbalancer --port 443:443@loadbalancer --registry-use k3d-registry.localhost:5000 --k3s-agent-arg '--kubelet-arg=eviction-hard=imagefs.available<1%,nodefs.available<1%' --k3s-agent-arg --kubelet-arg=eviction-minimum-reclaim=imagefs.available=1%,nodefs.available=1%
```

Now, we need traefik to accept insecure connections.

Get the current traefik configuration with

```
kubectl get cm traefik -n kube-system -o yaml > config.yaml
```

The beginning of the file config.yaml should look like this

```
apiVersion: v1
data:
  traefik.toml: |
    # traefik.toml
    logLevel = "info"
    defaultEntryPoints = ["http","https"]
    [entryPoints]
      [entryPoints.http]
...
```

After the third line `traefik.toml: |`, add the following line

```
insecureSkipVerify = true
```

So that the file now looks like this

```
apiVersion: v1
data:
  traefik.toml: |
    insecureSkipVerify = true
    # traefik.toml
    logLevel = "info"
    defaultEntryPoints = ["http","https"]
    [entryPoints]
      [entryPoints.http]
...
```

Then reapply the config with

```
kubectl --context k3d-k3s-default apply -n kube-system -f config.yaml
```

And finally kill the traefik pod so that a new pod is started up and with the
updated config.

```
kubectl delete pod -l app=traefik -n kube-system
```

The pods communicate using TLS. We need to setup certificates for it to work as
expected.

To do so, install the [cert-manager](https://cert-manager.io/) tool with

```
helm repo add jetstack https://charts.jetstack.io
helm --kube-context k3d-k3s-default upgrade --install --create-namespace --wait cert-manager jetstack/cert-manager --namespace cert-manager --version v1.2.0 --set installCRDs=true --set ingressShim.defaultIssuerName=local --set ingressShim.defaultIssuerKind=ClusterIssuer
```

And create a certificate issuer to make sure localhost connections will have a
correct certificate.

```
openssl genrsa -out ca.key 2048
openssl req -x509 -new -nodes -key ca.key -subj /CN=localhost -days 3650 -reqexts v3_req -extensions v3_ca -out ca.crt
ca_secret=$(kubectl --context k3d-k3s-default create secret tls ca-key-pair --cert=ca.crt --key=ca.key --namespace=cert-manager --dry-run=true -o yaml)
cat <<EOF > issuer.yaml
${ca_secret}
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: local
spec:
  ca:
    secretName: ca-key-pair
EOF
kubectl --context k3d-k3s-default apply -n cert-manager -f issuer.yaml
```

You are done setting up the stack.

#### Starting the stack

Now, simply run `tilt up` to run the developer stack.

The tag-api, tag-injection-worker, tag-operation-status-worker and
tag-send-transactions-worker deployment might fail at first, due to the fact
rabbitmq took a bit long to start. Simply restart then when the other
deployments are ready.

### Install in a managed cluster

At the bare minimum, you need to have cert-manager installed.

```shell
helm repo add jetstack https://charts.jetstack.io
helm upgrade --install --create-namespace --wait cert-manager jetstack/cert-manager --namespace cert-manager --version v1.2.0 --set installCRDs=true --set ingressShim.defaultIssuerName=local --set ingressShim.defaultIssuerKind=ClusterIssuer
```

Then, you can simply install the tezos-api-gateway helm chart.

```shell
helm install tezos-api-gateway ./helm/tezos-api-gateway
```

In case your cluster is local, you can use the provided development values.

```shell
helm install tezos-api-gateway ./helm/tezos-api-gateway --values ./helm/tezos-api-gateway/values-dev.yaml
```

### Discussing with the services

You can forward the following ports to communicate with the services of your
cluster.

- api : 3333
- vault : 8200
- db : 5432
- rabbitmq : 5672


Also, if you are using tilt, you can simply uncomment the corresponding lines in
the Tiltfile. tilt will automatically react and forward the ports.

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
