# SEND TRANSACTION WORKER

### ABOUT

This worker will build a queue based on the **_routing key_** and **_type of message exchange_** to consume the message sent from **Send Transactions controller**.

After consuming the message, **sign the transactions** (using the vault key mentioned in the message) and **send the transactions** to Tezos block chain.
Then it updates the corresponding **_job status_** to **_PUBLISHED_** and updates the **_operation hash_** (which is retrieved after sending the transactions).

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
npm run send-transactions-worker | bunyan
```

#### Run in dev mode

```
npm run send-transactions-worker:dev | bunyan
```

### ENVIRONMENT VARIABLES

| Name                                       | Default Value            | Explaination                                         |
| ------------------------------------------ | ------------------------ | ---------------------------------------------------- |
| AMQP_URL                                   | amqp://localhost         | the url to link to rabbiMq server                    |
| LOGGER_NAME                                | Send Transactions Worker | The name of the logger                               |
| LOGGER_LEVEL                               | info                     | The level of the logger                              |
| SEND_TRANSACTION_WORKER_NAME               | Send Transactions Worker | The name of the process                              |
| SEND_TRANSACTION_WORKER_TIMEOUT            | 3000                     | The process timeout in milliseconds                  |
| SEND_TRANSACTIONS_QUEUE_EXCHANGE           | topic_logs               | The exchange name that the queue should be formed by |
| SEND_TRANSACTIONS_QUEUE_EXCHANGE_TYPE      | topic                    | The exchange type                                    |
| SEND_TRANSACTIONS_WORKER_QUEUE_ROUTING_KEY | send_transactions.\*     | The routing key that the queue will be formed by     |
