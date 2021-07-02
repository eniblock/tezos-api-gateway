# CHECK OPERATION STATUS WORKER

### ABOUT

This worker is a cron job, which finds all the **JOBS** having status **_PUBLISHED_**
to check if the **operation hashes** corresponding to the jobs are confirmed on Tezos block chain or not.

If an operation hash is confirmed, it will publish a message to rabbitMq using exchange type **_headers_** to notify about the operation confirmation.

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
npm run check-operation-status | bunyan
```

#### Run in dev mode

```
npm run check-operation-status:dev | bunyan
```

### ENVIRONMENT VARIABLES

| Name                                  | Default Value                 | Explaination                        |
| ------------------------------------- | ----------------------------- | ----------------------------------- |
| LOGGER_NAME                           | Check Operation Status Worker | The name of the logger              |
| LOGGER_LEVEL                          | info                          | The level of the logger             |
| CHECK_OPERATION_STATUS_WORKER_NAME    | Check Operation Status Worker | The name of the process             |
| CHECK_OPERATION_STATUS_WORKER_TIMEOUT | 3000                          | The process timeout in milliseconds |
| CHECK_OPERATION_STATUS_CRON_TIME      | \* \* \* \* \*                | The frequency of the cron job       |
