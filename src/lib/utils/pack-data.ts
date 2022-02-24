import { logger } from '../../services/logger';
import { TezosService } from '../../services/tezos';
import { Schema } from '@taquito/michelson-encoder';
import { InvalidMapStructureParams } from '../../const/errors/invalid-entry-point-params';
import { MichelsonMap } from '@taquito/taquito';
import _ from 'lodash';
import { DataPackingParams } from '../../const/interfaces/utils/pack-data';

/**
 * @description    - Serialize Michelson data : convert JSON object to Michelson and pack data by calling the rpc client
 * @return  {Object}
 */
export async function packData(
  tezosService: TezosService,
  { data, type }: DataPackingParams,
): Promise<string> {
  try {
    const schema = new Schema(type);
    schema.findToken('map').forEach((mapToken) => {
      logger.info(
        { mapToken },
        '[lib/utils/packData] convert map to MichelsonMap',
      );
      data = findMapAndConvertToMichelson(data, mapToken.annot());
    });
    const encodedData = schema.Encode(data);
    logger.info(
      { encodedData },
      '[lib/utils/packData] encode data to Michelson',
    );
    const { packed } = await tezosService.rpcClient.packData({
      data: encodedData,
      type,
    });
    logger.info({ packed }, '[lib/utils/packData] packed value');
    return packed;
  } catch (err) {
    logger.error(
      { error: err },
      '[lib/utils/packData] Unexpected error happened',
    );

    throw err;
  }
}

function findMapAndConvertToMichelson(data: any, mapAnnot: string): any {
  if ((data as object).hasOwnProperty(mapAnnot)) {
    data[mapAnnot] = convertMapToMichelson(data[mapAnnot]);
  } else {
    if (Array.isArray(data)) {
      data.forEach((item) => {
        return findMapAndConvertToMichelson(item, mapAnnot);
      });
    }
    if (data && typeof data === 'object') {
      Object.keys(data).forEach((key) => {
        data[key] = findMapAndConvertToMichelson(data[key], mapAnnot);
      });
    }
  }
  return data;
}

function convertMapToMichelson(map: any) {
  if (!Array.isArray(map)) {
    throw new InvalidMapStructureParams();
  }
  const result = new MichelsonMap();
  map.forEach((param) => {
    if (!_.isEqual(Object.keys(param), ['key', 'value'])) {
      throw new InvalidMapStructureParams();
    }
    result.set(param.key, param.value);
  });
  return result;
}
