import { amqpConfig } from '../config';
import { AmqpService } from '../../../../services/amqp';
import { TransactionParametersJson } from '../../../../const/interfaces/transaction-parameters-json';
import { GenericObject } from '../../../../const/interfaces/forge-operation-params';

const { exchange } = amqpConfig;

export interface EventMessage {
  contractAddress: string;
  entrypoint: string;
  jobId: number;
  parameters: TransactionParametersJson;
}

/**
 * Publish the message to the rabbitmq when a transaction is confirmed
 *
 * @param {object} amqpService        - the amqp service helps to publish
 * @param {object} message            - the message which will be sent to rabbitmq
 * @param {object} headers            - the headers option since exchange header is going to be used
 */
export async function publishEventWhenTransactionsConfirmed(
  amqpService: AmqpService,
  message: EventMessage,
  headers: GenericObject,
) {
  if (!exchange) {
    throw new Error('Exchange is not set');
  }

  amqpService.publishMessage<EventMessage>(exchange.name, '', message, {
    headers,
  });
}
