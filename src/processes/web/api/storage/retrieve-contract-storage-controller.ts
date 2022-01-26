import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { dataFieldsSchema } from '../../../../const/ajv_schemas/data-fields';
import { ContractStorageRequestDataField } from '../../../../const/interfaces/contract-storage-request-datafield';
import { validateSchema, ValidationError } from '../../../../lib/ajv';
import * as getContractStorageLib from '../../../../lib/storage/get-contract-storage';
import { GatewayPool } from '../../../../services/gateway-pool';
import { logger } from '../../../../services/logger';

function retrieveContractStorageFromTezosNode(gatewayPool: GatewayPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dataFields } = req.body;
      const { contract_address: contractAddress } = req.params;

      if (dataFields) {
        validateSchema(dataFieldsSchema, dataFields);
      }

      logger.info(
        {
          contractAddress,
          dataFields,
        },
        '[storage/retrieve-contract-storage-controller] Going to retrieve contract storage information',
      );

      const tezosService = await gatewayPool.getTezosService();

      logger.info(
        {
          tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        },
        '[storage/retrieve-contract-storage-controller] Using this tezos node',
      );

      const result =
        await getContractStorageLib.getContractStorageObjectFromTezosNode(
          logger,
          tezosService,
          contractAddress,
          dataFields as unknown as ContractStorageRequestDataField[],
        );

      return res.status(StatusCodes.OK).json(result);
    } catch (err) {
      if (err instanceof ValidationError) {
        return next(
          createHttpError(StatusCodes.BAD_REQUEST, JSON.stringify(err.errors)),
        );
      }

      return next(err);
    }
  };
}

export default { retrieveContractStorageFromTezosNode };
