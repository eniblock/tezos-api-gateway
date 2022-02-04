import { logger } from '../../services/logger';
import { TezosService } from '../../services/tezos';
import { PackDataParams } from '@taquito/rpc';

/**
 * @description    - Signs an operation with a vault key
 * @return  {Object}
 */
export async function pachData(
  tezosService: TezosService,
  { data, type }: PackDataParams,
): Promise<string> {
  try {
    const { packed } = await tezosService.rpcClient.packData({ data, type });
    logger.info({ packed }, 'The packed value');
    return packed;
  } catch (err) {
    logger.error(
      { error: err },
      '[lib/test/packData] Unexpected error happened',
    );

    throw err;
  }
}
