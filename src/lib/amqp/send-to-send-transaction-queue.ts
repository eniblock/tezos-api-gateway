import { AmqpService } from '../../services/amqp';
import { SendTransactionsToQueueParams } from '../../const/interfaces/send-transactions-params';
import { QueuesEnum } from '../../const/queues-enum';

/**
 * Publish the send transactions parameters to the send transactions queue
 *
 * @param {object} amqpService        - the amqp service helps to publish
 * @param {object} parameter          - all the parameters to patch job
 */
export async function sendToSendTransactionQueue(
  amqpService: AmqpService,
  parameter: SendTransactionsToQueueParams,
) {
  await amqpService.sendToQueue<SendTransactionsToQueueParams>(
    parameter,
    QueuesEnum.SEND,
  );
}
