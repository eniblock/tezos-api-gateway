import { GatewayPool } from '../../services/gateway-pool';
import { PostgreService } from '../../services/postgre';
import { Jobs } from '../../const/interfaces/jobs';
import { logger } from '../../services/logger';
import { FakeSigner } from '../../services/signers/fake-signer';
import { Estimate } from '@taquito/taquito/dist/types/contract/estimate';
import { AddressAlreadyRevealedError } from '../../const/errors/address-already-revealed';
import { OperationContentsReveal } from '@taquito/rpc/dist/types/types';
import { OpKind } from '@taquito/rpc';
import { insertJob } from '../../models/jobs';
import { JobStatus } from '../../const/job-status';
import { insertOperations } from '../../models/operations';
import { AddressNotFoundError } from '../../const/errors/address-not-found-error';
import { RevealEstimateError } from '../../const/errors/reveal-estimate-error';

export async function forgeRevealOperation(
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  address: string,
  publicKey: string,
): Promise<Jobs> {
  const tezosService = await gatewayPool.getTezosService();

  logger.info(
    {
      tezosNode: tezosService.tezos.rpc.getRpcUrl(),
      address,
    },
    '[lib/jobs/forge-reveal-operation] Using this tezos node',
  );

  const signerToGetPKH = new FakeSigner(address, publicKey);

  tezosService.setSigner(signerToGetPKH);

  let estimation: Estimate | undefined;
  try {
    estimation = await tezosService.tezos.estimate.reveal();
  } catch (e) {
    logger.error({ error: e.message });
    logger.error(
      '[lib/jobs/forge-reveal-operation] Error when trying to estimate the reveal of address %s',
      address,
    );
    throw new RevealEstimateError(address, publicKey);
  }

  if (estimation === undefined) {
    logger.error(
      '[lib/jobs/forge-reveal-operation] Address %s is already revealed',
      address,
    );
    throw new AddressAlreadyRevealedError(address);
  }

  logger.info(
    estimation,
    '[lib/jobs/forge-reveal-operation] Estimate of the operation',
  );

  const { counter: counterAsString } = await tezosService.getContractResponse(
    address,
  );

  if (!counterAsString) {
    throw new AddressNotFoundError(address);
  }

  let counter = parseInt(counterAsString, 10);

  logger.info(
    { counter },
    '[lib/jobs/forge-operation/#getOperationContentsTransactionWithParametersJson] Find counter',
  );

  const revealOperation: OperationContentsReveal = {
    kind: OpKind.REVEAL,
    source: await signerToGetPKH.publicKeyHash(),
    fee: estimation.suggestedFeeMutez.toString(),
    counter: (++counter).toString(),
    gas_limit: estimation.gasLimit.toString(),
    storage_limit: estimation.storageLimit.toString(),
    public_key: await signerToGetPKH.publicKey(),
  };

  const { branch, forgedOperation } = await tezosService.forgeOperations([
    revealOperation,
  ]);

  const result = await insertJob(postgreService.pool, {
    rawTransaction: forgedOperation,
    status: JobStatus.CREATED,
  });

  const jobId = (result.rows[0] as Jobs).id;

  logger.info(
    { result: result.rows, jobId },
    '[lib/jobs/forge-reveal-operation] Successfully create a job after forging operation',
  );

  await insertOperations(
    postgreService.pool,
    [revealOperation],
    branch,
    jobId,
    '',
  );

  logger.info(
    '[lib/jobs/forgeOperation] Successfully saved parameters of forge function',
  );

  return result.rows[0] as Jobs;
}
