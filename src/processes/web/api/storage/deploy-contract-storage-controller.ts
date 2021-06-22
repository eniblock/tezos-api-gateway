import { StatusCodes } from 'http-status-codes';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import { spawn } from 'child_process';
import { DeployContractParams } from '../../../../const/interfaces/deploy-contract-params';
import { logger } from '../../../../services/logger';
import { GatewayPool } from '../../../../services/gateway-pool';
import { VaultSigner } from '../../../../services/signers/vault';
import { compilationSmartpyConf, vaultClientConfig } from '../../../../config';
import createHttpError from 'http-errors';
import { ClientError } from '../../../../const/errors/client-error';

/**
 * Makes contract deployment endpoint
 *
 * @param   {object} gatewayPool  - the service to generate tezosService
 *
 * @returns {function} - The endpoint for express
 */
function compileAndDeployContract(gatewayPool: GatewayPool) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        secureKeyName,
        compilationTarget,
        smartContractCode,
      }: DeployContractParams = req.body;

      logger.info(
        { secureKeyName, compilationTarget, smartContractCode },
        '[api/jobs/deploy-job-controller] properties received',
      );

      const [codeJson, storageJson] = await compileSmartpy(
        compilationTarget,
        smartContractCode,
      );

      const tezosService = await gatewayPool.getTezosService();

      logger.info(
        {
          tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        },
        '[api/jobs/deploy-job-controller] Using this tezos node',
      );

      const vaultSigner = new VaultSigner(
        vaultClientConfig,
        secureKeyName,
        logger,
      );

      tezosService.setSigner(vaultSigner);

      const pkh = await vaultSigner.publicKeyHash();

      logger.info(
        { publicKeyHash: pkh, secureKeyName },
        '[api/jobs/deploy-job-controller] This account requested to deploy a contract to Tezos',
      );

      const contractData = await tezosService.deployContract(
        codeJson,
        storageJson,
      );

      return res.status(StatusCodes.CREATED).json(contractData);
    } catch (err) {
      if (err instanceof ClientError) {
        return next(createHttpError(err.status, err.message));
      }

      return next(err);
    }
  };
}

async function compileSmartpy(
  compilationTarget: string,
  smartContractCode: string,
): Promise<string[]> {
  const compilationSmartpyConfModified = {
    ...compilationSmartpyConf,
    contractPath: `${compilationSmartpyConf.contractDirectory}/${compilationSmartpyConf.contractName}`,
    codeJsonLocalPath: `${compilationSmartpyConf.contractDirectory}/${compilationTarget}/step_000_cont_1_contract.json`,
    storageJsonLocalPath: `${compilationSmartpyConf.contractDirectory}/${compilationTarget}/step_000_cont_1_storage.json`,
  };

  await fs.writeFileSync(
    compilationSmartpyConfModified.contractPath,
    smartContractCode,
    {
      encoding: 'base64',
    },
  );

  if (compilationSmartpyConfModified.targetFormat.test(compilationTarget)) {
    const smartpysh = spawn(compilationSmartpyConfModified.commandPath, [
      'compile',
      compilationSmartpyConfModified.contractPath,
      compilationSmartpyConfModified.contractDirectory,
    ]);

    return new Promise((resolve, reject) => {
      smartpysh
        .on('close', async (code) => {
          if (code !== 0) reject('smartpysh failed to compile');
          else {
            const codeJson = await fs.readFileSync(
              compilationSmartpyConfModified.codeJsonLocalPath,
              'utf8',
            );
            const storageJson = await fs.readFileSync(
              compilationSmartpyConfModified.storageJsonLocalPath,
              'utf8',
            );

            resolve([codeJson, storageJson]);
          }
        })
        .on('error', (err: Error) => {
          reject(`binary not found: ${err.message}`);
        });
    });
  } else throw new Error('Compilation failed target format does not match');
}

export default { compileAndDeployContract };
