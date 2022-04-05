import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { AddressNotFoundError } from '../../../../const/errors/address-not-found-error';
import {
  InvalidMapStructureParams,
  PublicKeyUndefined,
  InvalidParameterName,
  InvalidVariantObject,
  MissingParameter,
  UnSupportedParameterSchema,
  InvalidParameter,
  InvalidBooleanParameter,
} from '../../../../const/errors/invalid-entry-point-params';
import { forgeOperation } from '../../../../lib/jobs/forge-operation';
import { GatewayPool } from '../../../../services/gateway-pool';
import { logger } from '../../../../services/logger';
import { PostgreService } from '../../../../services/postgre';
import { AddressNotRevealedError } from '../../../../const/errors/address-not-revealed';
import { RevealEstimateError } from '../../../../const/errors/reveal-estimate-error';
import { AddressAlreadyRevealedError } from '../../../../const/errors/address-already-revealed';
import { MaxOperationsPerBatchError } from '../../../../const/errors/max-operations-per-batch-error';
import { maxOperationsPerBatch } from '../../../../config';
import { TezosOperationError } from '@taquito/taquito';
import {
  AddressValidationError,
  BigMapValidationError,
  BytesValidationError,
  ChainIDValidationError,
  ContractValidationError,
  IntValidationError,
  KeyHashValidationError,
  KeyValidationError,
  ListValidationError,
  MapValidationError,
  MutezValidationError,
  NatValidationError,
  SetValidationError,
  SignatureValidationError,
} from '@taquito/michelson-encoder';
type ReqQuery = { useCache: boolean; reveal: boolean };

function forgeOperationAndCreateJob(
  gatewayPool: GatewayPool,
  postgreClient: PostgreService,
) {
  return async (
    req: Request<any, any, any, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { transactions, sourceAddress, callerId, publicKey } = req.body;
      const { useCache, reveal } = req.query;

      if (transactions.length > maxOperationsPerBatch)
        throw new MaxOperationsPerBatchError();

      if (reveal && publicKey === undefined) throw new PublicKeyUndefined();

      logger.info(
        {
          transactions,
          sourceAddress,
          callerId,
        },
        '[jobs/forge-job-controller] Forge operation with the following data',
      );

      const tezosService = await gatewayPool.getTezosService();

      logger.info(
        {
          tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        },
        '[jobs/forge-job-controller] Using this tezos node',
      );

      const job = await forgeOperation(
        {
          transactions,
          sourceAddress,
          callerId,
          publicKey,
          useCache,
          reveal,
        },
        tezosService,
        postgreClient,
      );

      return res.status(StatusCodes.CREATED).json(job);
    } catch (err) {
      if (err instanceof AddressNotFoundError) {
        return next(createHttpError(StatusCodes.NOT_FOUND, err.message));
      } else if (
        err instanceof InvalidMapStructureParams ||
        err instanceof PublicKeyUndefined ||
        err instanceof AddressNotRevealedError ||
        err instanceof RevealEstimateError ||
        err instanceof AddressAlreadyRevealedError ||
        err instanceof MaxOperationsPerBatchError ||
        err instanceof InvalidMapStructureParams ||
        err instanceof InvalidParameterName ||
        err instanceof InvalidParameter ||
        err instanceof MissingParameter ||
        err instanceof UnSupportedParameterSchema ||
        err instanceof InvalidVariantObject ||
        err instanceof InvalidBooleanParameter ||
        err instanceof ListValidationError ||
        err instanceof MapValidationError ||
        err instanceof SetValidationError ||
        err instanceof BigMapValidationError ||
        err instanceof ChainIDValidationError ||
        err instanceof KeyValidationError ||
        err instanceof ContractValidationError ||
        err instanceof SignatureValidationError ||
        err instanceof AddressValidationError ||
        err instanceof BytesValidationError ||
        err instanceof IntValidationError ||
        err instanceof KeyHashValidationError ||
        err instanceof MutezValidationError ||
        err instanceof NatValidationError ||
        err instanceof TezosOperationError
      ) {
        return next(createHttpError(StatusCodes.BAD_REQUEST, err.message));
      }

      return next(err);
    }
  };
}
export default { forgeOperationAndCreateJob };
