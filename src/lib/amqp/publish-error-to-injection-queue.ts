import { PatchJobParamsError } from '../../const/interfaces/patch-job-params-error';
import { AmqpService } from '../../services/amqp';

/**
 * Publish the error message to the injection queue
 *
 * @param {object} amqpService        - the amqp service helps to publish
 * @param {object} parameter          - error message
 */
export async function publishErrorToInjectionQueue(
  amqpService: AmqpService,
  parameter: PatchJobParamsError,
) {
  amqpService.sendToQueue<PatchJobParamsError>(parameter);
}
