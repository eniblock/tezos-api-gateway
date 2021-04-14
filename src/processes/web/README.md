# GENERIC API WEB SERVER

### ABOUT

This is web server that helps to interact with Tezos Block Chain. This server supports the following features:

- Forge operation (allow batch transactions)
- Inject transaction by passing **raw transaction** (forged operation) and signature
- Send transactions (allow batch transactions), using Vault signer to sign the transactions.
- Get the contract parameters schema
- Get the contract storage (allow deep into complex object/map parameter)

### Before running

Check if **postgres database**, **rabbitMq** and **vault server** are running. If not, you could start the services by using `docker-compose`.

```
docker-compose up -d postgres rabbitmq vault
```

### Run with docker

```
docker-compose up api
```

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
