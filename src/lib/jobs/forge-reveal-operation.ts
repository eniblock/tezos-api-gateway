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

export async function forgeRevealOperation(
  gatewayPool: GatewayPool,
  postgreService: PostgreService,
  address: string,
): Promise<Jobs> {
  try {
    const tezosService = await gatewayPool.getTezosService();

    logger.info(
      {
        tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        address,
      },
      '[lib/jobs/forge-reveal-operation] Using this tezos node',
    );

    const signerToGetPKH = new FakeSigner(
      address,
      'edpktj8hay78sAuA3aAHf5VmTppnA4WUpnSUnfhUECqfSw7guSkKma',
    );

    tezosService.setSigner(signerToGetPKH);

    const estimation:
      | Estimate
      | undefined = await tezosService.tezos.estimate.reveal();

    if (estimation === undefined)
      throw new AddressAlreadyRevealedError(address);

    logger.info(
      estimation,
      '[lib/jobs/forge-reveal-operation] Estimate of the operation',
    );

    const revealOperation: OperationContentsReveal = {
      kind: OpKind.REVEAL,
      source: await signerToGetPKH.publicKeyHash(),
      fee: estimation.suggestedFeeMutez.toString(),
      counter: '0',
      gas_limit: estimation.gasLimit.toString(),
      storage_limit: estimation.storageLimit.toString(),
      public_key: await signerToGetPKH.publicKey(),
    };

    const { forgedOperation } = await tezosService.forgeOperations([
      revealOperation,
    ]);

    const result = await insertJob(postgreService.pool, {
      rawTransaction: forgedOperation,
      status: JobStatus.CREATED,
    });

    return result.rows[0] as Jobs;
  } catch (err) {
    logger.error(
      { error: err.message },
      '[lib/jobs/forge-reveal-operation] Unexpected error happened',
    );

    throw err;
  }
}
