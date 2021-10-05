# INJECTION WORKER

### ABOUT

This worker will consume the messages from the **Injection Queue**, which contains the messages sent from **Injection controller**.

After consuming the message, **pre-apply the transactions** and **inject the transactions** to Tezos block chain.
Then it updates the corresponding **_job status_** to **_PUBLISHED_** and updates the **_operation hash_** (which is retrieved after injecting the transactions).

### Before running

Check if **postgres database**, **rabbitMq** and **vault server** are running. If not, you could start the services by using `docker-compose`.

```
docker-compose up -d postgres rabbitmq vault
```

### Run with docker

```
docker-compose up injection-worker
```

### Run locally

#### Install dependencies and build the project

<u>**_NOTES_**</u>: This step could be skipped if it already ran.

```
npm i
npm run build
```

#### Install bunyan and nodemon

<u>**_NOTES_**</u>: This is optional. **Bunyan** helps formatting the logs so it is easier to read and **nodemon** helps auto recompile the code while you are in dev mode.

```
npm i -g bunyan nodemon
```

#### Run the project

```
npm run injection-worker | bunyan
```

#### Run in dev mode

```
npm run injection-worker:dev | bunyan
```

### ENVIRONMENT VARIABLES

| Name                     | Default Value      | Explanation                             |
| ------------------------ | ------------------ | --------------------------------------- |
| AMQP_URL                 | amqp://localhost   | The URL to link to the RabbitMQ server  |
| AMQP_QUEUES              | inject-transaction | The name of the queues that can be used |
| LOGGER_NAME              | Injection Worker   | The name of the logger                  |
| LOGGER_LEVEL             | info               | The level of the logger                 |
| INJECTION_WORKER_NAME    | Injection Worker   | The name of the process                 |
| INJECTION_WORKER_TIMEOUT | 3000               | The process timeout in milliseconds     |
