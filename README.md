# TEZOS API GATEWAY

[![SonarCloud](https://sonarcloud.io/images/project_badges/sonarcloud-white.svg)](https://sonarcloud.io/dashboard?id=xdev-tech_tezos-api-gateway) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=xdev-tech_tezos-api-gateway&metric=alert_status)](https://sonarcloud.io/dashboard?id=xdev-tech_tezos-api-gateway)

![snyk logo](https://res.cloudinary.com/snyk/image/upload/v1468845142/favicon/favicon.ico)[To see snyk reports click here](https://app.snyk.io/org/bxdev/projects)

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

| Name                                       | Default Value                                                                                              | Explanation                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| AMQP_URL                                   | amqp://localhost                                                                                           | The url to link to the RabbitMQ server                       |
| AMQP_QUEUES                                | inject-transaction send-transaction                                                                        | The name of the queues that can be used                      |
| CONTRACT_ADDRESS                           | KT1LnJEtZttLAJeP45EzYvChAksRS1xE4hJ1                                                                       | The smart contract address used for Generated API Web server |
| DB_HOST                                    | localhost-service                                                                                          | The database host                                            |
| DB_NAME                                    | tezos_api_gateway                                                                                          | The database name                                            |
| DB_PORT                                    | 5432                                                                                                       | The port to connect to database                              |
| DB_PWD                                     | randompwd                                                                                                  | The password to connect to database                          |
| DB_USERNAME                                | tezos-service                                                                                              | The user name to connect to database                         |
| LOGGER_NAME                                | TezosApiGateway                                                                                            | The name of the logger                                       |
| LOGGER_LEVEL                               | info                                                                                                       | The level of the logger                                      |
| WEB_PROCESS_NAME                           | Tezos Api Gateway                                                                                          | The name of the process                                      |
| WEB_PROCESS_TIMEOUT                        | 3000                                                                                                       | The process timeout in milliseconds                          |
| TEZOS_NODE_URLS                            | https://hangzhounet.smartpy.io<br />https://hangzhounet.api.tez.ie<br />https://rpc.hangzhou.tzstats.com   | List of Tezos Node URLs                                      |
| VAULT_URL                                  | http://localhost:8300/v1/                                                                                  | The vault server URL                                         |
| VAULT_TOKEN                                | myroot                                                                                                     | The api token to access Vault server                         |

**Indexer Environment Variables**

| Name                           | Default Value                                                                                        | Explanation                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| TZSTATS_URL                    | https://api.hangzhou.tzstats.com/explorer/op/                                                        | The Tzstat API Url to retrieve information about an operation            |
| TZSTATS_KEY_TO_OPERATION       | 0                                                                                                    | The object key or array index to get the the information of an operation |
| TZSTATS_KEY_TO_BLOCK_LEVEL     | height                                                                                               | The object key representing the block level                              |
| TZKT_URL                       | https://api.hangzhou2net.tzkt.io/v1/operations/                                                      | The Tzkt API Url to retrieve information about an operation              |
| TZKT_KEY_TO_OPERATION          | 0                                                                                                    | The object key or array index to get the the information of an operation |
| TZKT_KEY_TO_BLOCK_LEVEL        | level                                                                                                | The object key representing the block level                              |

**Test Environment Variables**

| Name                 | Default Value                                                       | Explanation                                     |
| -------------------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| AMQP_URL             | amqp://localhost                                                    | The url to link to rabbiMq server               |
| DB_HOST_TEST         | localhost-service                                                   | The database host                               |
| DB_NAME_TEST         | tezos_api_gateway                                                   | The database name                               |
| DB_PORT_TEST         | 5432                                                                | The port to connect to database                 |
| DB_PWD_TEST          | randompwd                                                           | The password to connect to database             |
| DB_USERNAME_TEST     | tezos-service                                                       | The user name to connect to database            |
| TEZOS_NODE_TEST      | https://hangzhounet.smartpy.io/                                     | A Tezos Node URL                                |
| TEZOS_NODE_TEST_URLS | https://hangzhounet.api.tez.ie<br />https://hangzhounet.smartpy.io/ | List of Tezos Node Urls, separated by comma `,` |

## Kubernetes Installation
### Summary

1. [Prerequisites](#1-prerequisites-for-local-environment)
2. [Setup](#2-setup)

### 1. Prerequisites for local environment
We assume that [**docker**](https://docs.docker.com/engine/install/ubuntu/#installation-methods) is already installed on your computer.
In order to run tezos-api-gateway environment locally you need to have some dependencies:
- k3d (v4.4.4)
- helm
- kubectl
- tilt
- python3
- pip3

Also you need to have a local registry, a local cluster and a cert-manager.

<br/>

#### Ubuntu 20.04

**Fortunately**, there is a tool out there, called `clk k8s` that tries to make
this task as lean as possible.

If you are new to clk, simply run:

```shell
curl -sSL https://clk-project.org/install.sh | env CLK_EXTENSIONS=k8s bash
```

If you already have clk installed and just want to install the [k8s
extension](https://github.com/clk-project/clk_extension_k8s), then run.

```shell
# Ensure the path ~/.local/bin is in you env PATH
# eg. export PATH=$PATH:/home/$USER/.local/bin
clk extension install k8s
```

Finally to install everything.

```shell
clk k8s flow
```

We heavily rely on this tool to have a running development cluster. Therefore,
we trust in it to use suitable versions of the binaries to use.

At the time [2021-12-03] of writing this documentation, the tool indicates that the binaries
that are installed come from those locations.

```shell
$ clk k8s show-dependencies
k3d https://github.com/rancher/k3d/releases/download/v4.4.4/k3d-linux-amd64
kind https://kind.sigs.k8s.io/dl/v0.11.1/kind-linux-amd64
helm https://get.helm.sh/helm-v3.6.3-linux-amd64.tar.gz
kubectl https://dl.k8s.io/release/v1.21.2/bin/linux/amd64/kubectl
kubectl_buildkit https://github.com/vmware-tanzu/buildkit-cli-for-kubectl/releases/download/v0.1.3/linux-v0.1.3.tgz
tilt https://github.com/tilt-dev/tilt/releases/download/v0.22.7/tilt.0.22.7.linux.x86_64.tar.gz
```

Also, to get some insight of what is done behind the hood to setup the local
cluster, here is what clk k8s tells us when run in dry run mode.

```shell
$ clk --dry-run k8s flow
(dry-run) download kubectl from https://dl.k8s.io/release/v1.21.2/bin/linux/amd64/kubectl
(dry-run) download kubectl_buildkit from https://github.com/vmware-tanzu/buildkit-cli-for-kubectl/releases/download/v0.1.3/linux-v0.1.3.tgz
(dry-run) download helm from https://get.helm.sh/helm-v3.6.3-linux-amd64.tar.gz
(dry-run) download tilt from https://github.com/tilt-dev/tilt/releases/download/v0.22.7/tilt.0.22.7.linux.x86_64.tar.gz
(dry-run) download k3d from https://github.com/rancher/k3d/releases/download/v4.4.4/k3d-linux-amd64
(dry-run) download kind from https://kind.sigs.k8s.io/dl/v0.11.1/kind-linux-amd64
(dry-run) run: docker run -d --restart=always -p 5000:5000 --name kind-registry registry:2
(dry-run) create a kind cluster. Here, there are many subtle hacks that are done before and after creating the cluster. Therefore I cannot describe it in dry-run mode. Please take a look at the code to find out what it does.
(dry-run) run: helm repo add cilium https://helm.cilium.io/
(dry-run) run: helm --kube-context kind-kind upgrade --install --wait cilium cilium/cilium --version 1.9.10 --namespace kube-system --set nodeinit.enabled=true --set kubeProxyReplacement=partial --set hostServices.enabled=false --set externalIPs.enabled=true --set nodePort.enabled=true --set hostPort.enabled=true --set bpf.masquerade=false --set image.pullPolicy=IfNotPresent --set ipam.mode=kubernetes --set operator.replicas=1
(dry-run) run: helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
(dry-run) run: helm --kube-context kind-kind upgrade --install --create-namespace --wait ingress-nginx ingress-nginx/ingress-nginx --namespace ingress --version v3.35.0 --set rbac.create=true --set controller.service.type=NodePort --set controller.hostPort.enabled=true
(dry-run) run: helm repo add jetstack https://charts.jetstack.io
(dry-run) run: helm --kube-context kind-kind upgrade --install --create-namespace --wait cert-manager jetstack/cert-manager --namespace cert-manager --version v1.2.0 --set installCRDs=true --set ingressShim.defaultIssuerName=local --set ingressShim.defaultIssuerKind=ClusterIssuer
(dry-run) generating a certificate authority. I cannot describe in short what is done there. Please take a look at the code if you want to know more.
(dry-run) run: kubectl --context kind-kind apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.50.0/example/prometheus-operator-crd/monitoring.coreos.com_alertmanagerconfigs.yaml
(dry-run) run: kubectl --context kind-kind apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.50.0/example/prometheus-operator-crd/monitoring.coreos.com_alertmanagers.yaml
(dry-run) run: kubectl --context kind-kind apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.50.0/example/prometheus-operator-crd/monitoring.coreos.com_podmonitors.yaml
(dry-run) run: kubectl --context kind-kind apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.50.0/example/prometheus-operator-crd/monitoring.coreos.com_probes.yaml
(dry-run) run: kubectl --context kind-kind apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.50.0/example/prometheus-operator-crd/monitoring.coreos.com_prometheuses.yaml
(dry-run) run: kubectl --context kind-kind apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.50.0/example/prometheus-operator-crd/monitoring.coreos.com_prometheusrules.yaml
(dry-run) run: kubectl --context kind-kind apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.50.0/example/prometheus-operator-crd/monitoring.coreos.com_servicemonitors.yaml
(dry-run) run: kubectl --context kind-kind apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/v0.50.0/example/prometheus-operator-crd/monitoring.coreos.com_thanosrulers.yaml
(dry-run) run kubectl apply to install some network policies.  Take a look at the code to understand what is installed exactly.
```

##### Side note in case you are using the k3d distribution
In case you explicitly asked for having a k3d local Kubernetes stack instead of
kind, the default one (using `clk k8s --distribution k3d flow` for
example). Here are some troubles you might get into.

:exclamation: :no_entry: **Be careful** if `clk k8s --distribution k3d flow`
never ends do not close the *clk* process and open a new terminal.  You probably
have a restarting container.  To verify it you can use **'docker ps'**.  Then
look at the status of **rancher/k3s** image.  So if the status is
**'Restarting'**.  Then display the logs of rancher/k3s.  eg. **docker logs
<em>\<CONTAINER ID></em>** at the end it should probably display the following:

```shell
conntrack.go:103] Set sysctl 'net/netfilter/nf_conntrack_max' to <A NUMBER>
server.go:495] open /proc/sys/net/netfilter/nf_conntrack_max: permission denied
```

The k3s image couldn't set a 'Maximum connection tracking' for the kernel's networking stack.
So do it manually.
eg. **sudo sysctl -w net/netfilter/nf_conntrack_max=<em>\<THE NUMBER DISPLAYED IN LOGS></em>**
Wait until the rancher/k3s container status is 'UP'.
Now redo the previous **clk command** or in case you closed the *clk* process you need to delete the k3d cluster and registry
eg. ***k3d cluster delete && k3d registry delete --all***. Then you can redo the previous **clk command**

<br/>

#### Mac os
Before going any further, make sure that kubernetes is enabled in docker desktop preferences.
You need to install some dependencies
```shell
# install k3d 4.4.4 for compatibility with click-project k8s extension
curl -s https://raw.githubusercontent.com/rancher/k3d/main/install.sh | TAG=v4.4.4 bash
brew install helm
brew install kubectl
brew install tilt-dev/tap/tilt
python3 -m pip install click-project --user
```

Then you need to fetch a "extension" called k8s.
```shell
# Ensure the path ~/.local/bin is in you env PATH
# eg. export PATH=$PATH:/home/$USER/.local/bin
clk extension install k8s
```

Finally to install everything.
```shell
clk k8s install-local-registry
clk k8s create-cluster
clk k8s install-cert-manager
```

:exclamation: :no_entry: After the previous command (clk k8s install-cert-manager) if the folling error appears:
```shell
Error Loading request extension section v3_req
```
You can fix it by modifying the install-cert-manage config.
For me the config was downloaded at "/Users/$USER/Library/Application Support/clk/extensions/k8s/python/k8s.py"
open it and go at the line number 293 and add this line:
'-config', '/usr/local/etc/openssl@1.1/openssl.cnf'
generally, alternative version of openssl configs are installed via homebrew, check if the openssl.cnf exist.
Now save then you can redo the previous *clk* command

<br/>

### 2. Setup
Clone the repo
```shell
git clone git@gitlab.com:xdev-tech/xdev-enterprise-business-network/tezos-api-gateway.git
cd tezos-api-gateway
```

Now you need to add tezos-api-gateway charts and apply them in the cluster with tilt.
```shell
export HELM_EXPERIMENTAL_OCI=1; helm dependency update ./helm/tezos-api-gateway
tilt up
```

**Or** just simply run helm to deploy it as you always do.
```shell
export HELM_EXPERIMENTAL_OCI=1; helm dependency update ./helm/tezos-api-gateway
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
