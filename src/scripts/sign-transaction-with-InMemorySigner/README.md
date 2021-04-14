# SIGN RAW TRANSACTION WITH IN MEMORY SIGNER

### ABOUT

This is a simple script that helps to sign a raw transaction (forged operation) with InMemorySigner of Taquito. This script is used to help the process of testing the Forge controller and Injection controller.

### HOW TO USE

1. Set the correct `TEZOS_PRIVATE_KEY` environment variable. This is the private key of the tezos account that forged the transactions, and also the account that is going to sign the transactions.
2. Set the correct `FORGE_OPERATION` env var. This is the raw transaction that is get from the **Forge API**.
3. (**_Optional_**) Build the project: `npm run build`
4. Run the script: `node build/src/scripts/sign-transaction-with-InMemorySigner/main.js | bunyan`
