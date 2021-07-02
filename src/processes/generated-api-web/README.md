# GENERATED API WEB SERVER

### ABOUT

Like generic api web server, this web server also helps to interact with Tezos Block Chain.
**Before setting up the express server**, it calls Tezos Block chain to get the **parameters schema of a smart contract**
(the smart contract address is retrieved from environment variable).
This server supports the following features:

- Forge operation
- Inject transaction by passing **raw transaction** (forged operation) and signature
- Send transactions, using Vault signer to sign the transactions.
- Get the contract parameters schema
- Get the contract storage (allow deep into complex object/map parameter)

<u>**_NOTES_**</u>: Please note that this web server **DOES NOT SUPPORT BATCH TRANSACTIONS OPTION**

### Before running

Make sure the support services are running by using the docker-compose file at the root of this project.

### Run locally

#### Install dependencies and build the project

<u>**_NOTES_**</u>: This step could be skipped if it already ran.

```
npm i
npm run build
```

#### Install bunyan and nodemon

<u>**_NOTES_**</u>: This is optional. **Bunyan** helps to format the logs, so it is easier to read and **nodemon** helps auto recompile the code while you are in dev mode.

```
npm i -g bunyan nodemon
```

#### Run the project

```
npm run start | bunyan
```

#### Run in dev mode

```
npm run start:dev | bunyan
```

### API DOCS

After running the server, access `http://localhost:3333/api-docs/` to see the API's documentation.

<u>**_NOTES_**</u>: If you are running with **docker**, the port is **4444**.
