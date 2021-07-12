# Introduction

The Tezos API Gateway deploys simple and robust APIs to manage your smart contracts. From our experience working in the blockchain industry, the Tezos API Gateway aims to follow simple values:

- **Easy to use**

  The Tezos API Gateway takes everything an application developer needs to focus
  on the Business Logic and user experience, without getting stuck in the
  complexities of Tezos transaction submission, thick client libraries,
  transaction signing and contract management. Once deployed, the Tezos API
  Gateway generates intuitive APIs following your smart contract methods and
  industry standard OpenAPI definitions, it becomes smooth to call them.

- **Interoperability**

  The client libraries to integrate Tezos for some languages are not mature
  enough. The Tezos API Gateway adds a REST API layer in top of the most
  achieved library Taquito facilitating connectivity for your clients.

- **Reliability**

  Submitting a transaction into the blockchain is not an easy task, it can be
  hard to ensure that a transaction is confirmed. The operation manager is here
  to follow the lifecycle of your transactions, from the signature to the
  confirmation and gives you an up-to-date status of them. It also handles
  connectivity problems that can occurs with a retry strategy. Also, the Tezos
  API Gateway introduces the concept of pools. It lets you choose to connect to
  a pool of Tezos nodes and indexers which reduces the dependency to a
  particular node or indexer and improves reliability.

- **Secured**

  The keys are stored off-platform using the remote signer of Taquito. The Tezos
  API Gateway is able to connect to an external signature manager based on
  Vault’s Transit to sign inside Vault through a remote signer.

- **Share with the community**

  We deeply think that cooperation is key to federate the Tezos community behind
  enterprise grade tools. The Tezos API Gateway will propose to include some of
  the features directly to existing projects like Taquito for the pool of nodes.

- **Scaling**

  In order to achieve and absorb a huge volume of transactions, the Tezos API
  Gateway is based on an event-driven architecture. Every transaction is first
  delivered to a messasing queue, that operates as a buffer, meaning that the
  response time of the API are very low. Both API and queues can be horizontally
  scaled to speed up the processing of transactions.

# State of art

Our insights comes from our experience using multiple blockchains like Ethereum,
Hyperledger, Corda and Tezos. We decided to compare existing solutions in the
tezos and ethereum communities to close the gap and build useful features for
the Tezos community.

## Ethereum solutions

[Kaleido - ETH API gateway](https://www.kaleido.io/blockchain-platform/rest-api-gateway) : APIs for all your Smart Contracts, backed by reliable Kafka streaming

[0xcert](https://0xcert.org): Build decentralized apps using fungible and non-fungible tokens quickly, cost efficiently and securely.

[Tatum](https://tatum.io/): The fastest way to develop blockchain apps

[Alchemy](https://alchemyapi.io/): Ethereum development made easy

[BlockCypher](https://www.blockcypher.com/): BlockCypher is the infrastructure fabric for blockchain applications

## Tezos solutions

[Tezos Link](https://github.com/octo-technology/tezos-link): Tezos link is a gateway to access to the Tezos network aiming to improve developer experience when developing Tezos dApps.

Drawbacks: Tezos link aims to deploy a network, nothing more.

[DataHub](https://figment.io/datahub/): DataHub lets developers use the most powerful and unique features of a blockchain without having to become protocol experts.

Drawbacks: DataHub doesn’t allow to connect to a pool of nodes

# Current situation

Applications that require sending data to the Tezos blockchain network have to
implement services to forge, sign, submit, confirm operations. Such services can
be developed using open source SDK libraries such as ConseilJS or
Taquito. However, there are some drawbacks:

- Both libraries are limited to JavaScript. In case the application is written in another language, there is a need to develop an external service in an additional language.

- Both libraries require a deep knowledge of the Tezos blockchain.

- Both libraries are low-level: developers have to manage (i.e. code) themselves the lifecycle of operations from their construction to their confirmation.

- Private key management is not covered by the SDKs

Therefore, the development of application interacting with Tezos is not straightforward and requires a lot of learning, conception and development time.

## Code readability

The code readability is a major aspect in the success of a project because it helps its maintenance, understanding and acceptance from the community and mainteners.

ConseilJS for instance, does not provide an easy, meaningful and readable to access a contract storage. ConseilJS simply returns the Storage JSON object which is sent by Tezos API, without building into a contract object. Taquito, one of ConseilJS competitor, does provide this function, which means Taquito help developers easily access to contract storage as a Javascript object.

```typescript
import { TezosNodeReader } from 'conseiljs';

const TEZOS_NODE_ADDRESS = 'https://carthagenet.tzstats.com/';
const CONTRACT_ADDREAS = 'KT1HhpXX2oewsqCmCZoGJVTbQY94F6x9FzRf';

const contractStorage = await TezosNodeReader.getContractStorage(
  TEZOS_NODE_ADDRESS,
  CONTRACT_ADDREAS,
);

const supply = contractStorage?.args[0]?.args[1]?.args[1]?.args[0]?.int;
const investorList = contractStorage?.args[0]?.args[0]?.args[1]?.args[1].map(
  (a: { string: any }) => a.string,
);
```

_Contract storage example using ConseilJS_

## Usage complexity

Michelson, the Tezos Smart contract language, is low-level and not very friendly for the developers. That is why high-level languages like SmartPy has been introduced to the community.

However, developers still must understand about Michelson language (or at least know how Michelson structure the common data type such as Map, Array, … ) to pass the correct parameters to contract entry points when using ConseilJS. Building Michelson parameters could make the code not readable and confusing. In addition, when a parameter is Map or BigMap, it is more complicated to build the Michelson parameter.

On the other hand, Taquito allows developers to pass the entry points parameter directly, without the step building Michelson parameters. Taquito also provide the BigMap solution.

```typescript
import { TezosNodeWriter } from 'conseiljs';

const tezosNode = 'https://carthagenet.tzstats.com/';

const keystore = {
  publicKey: 'edpkvQtuhdZQmjdjVfaY9Kf4hHfrRJYugaJErkCGvV3ER1S7XWsrrj',
  privateKey:
    'edskRgu8wHxjwayvnmpLDDijzD3VZDoAH7ZLqJWuG4zg7LbxmSWZWhtkSyM5Uby41rGfsBGk4iPKWHSDniFyCRv3j7YFCknyHH',
  publicKeyHash: 'tz1QSHaKpTFhgHLbqinyYRjxD5sLcbfbzhxy',
  seed: '',
  storeType: StoreType.Fundraiser,
};

const contractAddress = 'KT1XFXwWCDMLkgWjhfqKUpDtBYWf3ZdUdKC3';

const parameters =
  '(Left (Left (Left (Pair source-address (Pair destination-address 999)))))';

const result = await TezosNodeWriter.sendContractInvocationOperation(
  tezosNode,
  keystore,
  contractAddress,
  amount,
  fee,
  derivationPath,
  storageLimit,
  gasLimit,
  entryPoint,
  parameters,
  TezosParameterFormat.Michelson,
);
```

_(Example using ConseilJs to interact with contract entry point)_

## Error handling

A well designed error handling is strategic to help the developers maintain their systems and build robust dApps. Tezos RPC and blockchain errors can be tricky to understand and handle.

For example, when Tezos API throws an error, ConseilJS does not rebuild an error object which leads to difficulties to manipulate it. On the other hand, Taquito uses the error information to build a specific TezosOperationError.

## Node & indexer reliability

Decentralized applications based on Tezos have two options to interact with the blockchain network: either self-hosting a node or use a public gateway such as GigaNode. While the first option is definitely the most adequate in a decentralized context, it requires a dedicated infrastructure and maintenance time. Therefore, a lot of projects prefer the second option as it has been the case for Ethereum DApps and their extensive use of Infura.

However, public gateways supporting Tezos are not yet as mature and stable as their Ethereum or Bitcoin counterparts. Indeed, we have experienced erratic instability issues while using public gateways which were not responding for several hours. This instability is not acceptable for critical decentralized applications in a production set-up.

In addition, DApps often require to retrieve information from indexers which provides detailed data about the ledger and its operations status. For instance, indexers can be used to confirm that an operation has been successfully integrated in the ledger. Those indexers can also be unstable, hindering the SLA of dApps using them.

## Features coverage

It’s important to cover all the features that Tezos offers. Some client libraries does not provide full implementations of the Tezos API. ConseilJS for example, does not support Batch API while Taquito does.

With the Tezos API Gateway, we aim to cover all the features through the APIs by helping directly those open source libraries.

# Proposed solution

## Architecture

The goal of this project is to provide a service that handles all the interactions with the Tezos blockchain and all the complexity of managing operations, in a robust way.

The Tezos API Gateway exposes a unified REST API to let dApps interact with the Tezos network through several transparent services :

- An Intuitive REST APIs generated for you, along with industry standard OpenAPI definitions, to call your smart contracts.

- An operation manager that handles the lifecycle of Tezos operations in an event-driver fashion.

- A connection to a signature manager to handle securely private key and operation signatures using a Taquito remote signer.

- A pool of gateways gathering several public node gateways.

- A pool of indexers gathering several public blockchain explorer.

The Tezos API Gateway is available as a docker container and can be self-hosted.

## Smart Contract API generator

This service is the starting entry point for application, it will generate the
Smart contract API using the address of the smart contract deployed in Tezos
blockchain. Thanks to Taquito introspection mechanism, public endpoint will be
exposed as an REST API. The code generator will work on runtime, meaning that
the publication of the web service can be done just after the generation.

## Smart Contract API

The smart contract API provides a user friendly REST API of your smart contract. you will be able to access to any endpoint of your smart contract by calling a generated API that matchs your smart contract methods.

This service uses node and Express to serve the APIs.

Generic endpoint to all smart contract like /operations, to retrieve all the operations which involve the smart contract, and /endpoints, which list of the endpoints, will be generated to provide more functionalities to easier the development of an application.

Smart contract API will be decorated with OpenApi documentation to be displayed by Swagger or other OpenApi reader.

## Operation Manager

Tezos API Gateway handles the lifecycle of your operations. Each operation is forged on-demand, but signed off platform.

The state of an operation can be requested through the API at any moment. Once the operation is confirmed, a webhook is called on the external application to notify the event. The operation manage will have a cache system as a temporal storage of not submitted operation. Confirmed operation will be not duplicated in any other database.

All the transactions are first sent to a messaging queue in order to have low response time and to be able to scale.

The operation manager is built in typescript, uses a cache to follow the status of operations and RabbitMQ to deliver the transactions to the Gateway Pool.

## Signature manager (not part of the Tezos API gateway)

The signature of the transactions is, by default, delegated to an external signature manager (not covered by the Tezos API Gateway).

This signature manager is dedicated to generate and store Tezos private keys. If the keys are generated in the first version (ED25519), they can be used to sign operations. This service is based on the open source Hashicorp Vault secure secret storage.

Eventually, Tezos API Gateway lets the user decides which Taquito signer to use but it will provide an open source Taquito remote signer to connect to the signature manager.

## Gateway Pool

A service based on Taquito to submit operations to the Tezos network using a pool of public gateways. We are suggesting to add this feature directly into Taquito. This service consumes the transactions from the messaging queue and submit them to a Tezos node chosen using a strategy (ie round-robin).

Each time a request fails for a randomly chosen public service, the gateway pool will automatically retry the request using another public service. Given that the probability that more than one public service is unhealthy is very low, dApps can rely on the stability of our the gateway pool.

Supported node gateway public services:

- GigaNode (Ukraine)

- Smartpy’s node (USA)

- Conseil’s node (cryptonomic) (USA)

- Your own node 

The Gateway Pool is built in typescript and uses Taquito to forge and submit transactions to Tezos.

## Indexer Pool

A service used to retrieve blockchain data (e.g. operation status) using a pool of public indexers. Also, since every indexers have minor differences, Tezos API Gateway provices a unique API on top on the supported indexers in order to homogenize the access.

Supported public indexers:

- TzStats (Canada)

- TZKT (Estonia)

- Conseil API (cryptonomic) (USA)

- Your own indexer

The Indexer Pool is built in typescript.

## Benefits

## Enterprise grade connectivity

The time of proof of concept and MVP are now over for the blockchain technologies, we need production ready tools that can be reliable in any case. The Tezos API Gateway will bring to the Tezos galaxy an enterprise grade connectivity and scaling.

## Widening the access to Tezos to more technologies

The usage of REST API opens up Tezos to every languages which will bring more attention and projects to considering Tezos as their blockchain.

## Bring more developers to Tezos

Since the beginning, it always has been complicated to develop and interact with blockchains. Thanks to the API and the operation manager, the Tezos API Gateway accelerates the learning curve of developers new to the blockchain concepts and let them focus on the business part.

## Helping the community

The motivation behind this project was to avoid all the hassles every time we need to use Tezos. But we think this experience and work should be shared with the whole community for 2 reasons:

- To have feedbacks, our ideas challenged and to gather more people to back the project.

- Helping others solutions like Taquito by adding features (Gateway Pool for instance).
