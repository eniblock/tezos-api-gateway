import { AmqpService } from '../../services/amqp';
import { SendTransactionsToQueueParams } from '../../const/interfaces/send-transactions-params';
import { amqpConfig } from '../../config';

const { exchange, routingKey } = amqpConfig;
/**
 * Publish the send transactions parameters to the send transactions queue
 *
 * @param {object} amqpService        - the amqp service helps to publish
 * @param {object} parameter          - all the parameters to patch job
 */
export async function publishForSendTransactions(
  amqpService: AmqpService,
  parameter: SendTransactionsToQueueParams,
) {
  if (!exchange) {
    throw new Error('Exchange is not set');
  }

  amqpService.publishMessage<SendTransactionsToQueueParams>(
    exchange.name,
    `${routingKey}.${parameter.secureKeyName}`,
    parameter,
  );
}
