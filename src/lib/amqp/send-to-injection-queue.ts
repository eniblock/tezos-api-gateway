import { AmqpService } from '../../services/amqp';
import { PatchJobParams } from '../../const/interfaces/patch-job-params';
import { QueuesEnum } from '../../const/queues-enum';

/**
 * Publish the patch job parameters to the injection queue
 *
 * @param {object} amqpService        - the amqp service helps to publish
 * @param {object} parameter          - all the parameters to patch job
 */
export async function sendToInjectionQueue(
  amqpService: AmqpService,
  parameter: PatchJobParams,
) {
  amqpService.sendToQueue(parameter, QueuesEnum.INJECT);
}
