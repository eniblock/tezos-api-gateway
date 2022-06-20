###Context
Upgrade Tezos API Gateway to be compatible with a new protocol upgrade

###Upgrade steps

- Upgrade Taquito
- Upgrade URLs for rpc nodes and indexers:
  - [src/config/index.ts]()
  - [test/\_\_fixtures\_\_/config/index.ts]()
  - [test/unit/services/clients/indexer-client.test.ts]()
- Deploy contracts and activate accounts in [test/\_\_fixtures\_\_/smart-contract/index.ts]()
  based on smart contract code in [smartPy-contracts]()
- Call the endpoint `transfer` of the deployed `flexibleTokenContract` contract with the following parameters
  (you can use the postman collection in [postman/TAG testnet upgrade.postman_collection.json]()):

```
{
  parameters: {
    destination: testAccount,
    tokens: '0',
  },
  source: revealedAccount.address,
}
```

- Then update the following config constants according to the previous call:
  - operationHash in [test/\_\_fixtures\_\_/operation/index.ts]()
  - firstTx in [test/\_\_fixtures\_\_/transactions/index.ts]()
- Call any endpoint of the contract `simpleContract` 10 times
  (you can use the postman collection in [postman/TAG testnet upgrade.postman_collection.json]())
- Run through the tests and fix failing ones
