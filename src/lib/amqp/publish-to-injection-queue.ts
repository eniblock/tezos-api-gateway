import { AmqpService } from '../../services/amqp';
import { PatchJobParams } from '../../const/interfaces/patch-job-params';

/**
 * Publish the patch job parameters to the injection queue
 *
 * @param {object} amqpService        - the amqp service helps to publish
 * @param {object} parameter          - all the parameters to patch job
 */
export async function publishToInjectionQueue(
  amqpService: AmqpService,
  parameter: PatchJobParams,
) {
  amqpService.sendToQueue<PatchJobParams>(parameter);
}
