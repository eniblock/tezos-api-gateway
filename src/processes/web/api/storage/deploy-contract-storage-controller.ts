import { StatusCodes } from 'http-status-codes';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import { spawn } from 'child_process';
import glob from 'glob';
import createHttpError from 'http-errors';
import { DeployContractParams } from '../../../../const/interfaces/deploy-contract-params';
import { logger } from '../../../../services/logger';
import { GatewayPool } from '../../../../services/gateway-pool';
import { SignerFactory } from '../../../../services/signer-factory';
import { compilationSmartpyConf, vaultClientConfig } from '../../../../config';
import { ClientError } from '../../../../const/errors/client-error';
import { VaultSigner } from '../../../../services/signers/vault';

/**
 * Makes contract deployment endpoint
 *
 * @param   {object} gatewayPool  - the service to generate tezosService
 *
 * @returns {function} - The endpoint for express
 */
function compileAndDeployContract(
  gatewayPool: GatewayPool,
  signerFactory: SignerFactory,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        secureKeyName,
        codeJson,
        storageJson,
        storageObj,
      }: DeployContractParams = req.body;

      logger.info(
        { secureKeyName, codeJson, storageJson, storageObj },
        '[api/storage/deploy-job-controller] properties received',
      );

      const tezosService = await gatewayPool.getTezosService();

      logger.info(
        {
          tezosNode: tezosService.tezos.rpc.getRpcUrl(),
        },
        '[api/storage/deploy-job-controller] Using this tezos node',
      );

      const vaultSigner = signerFactory.generateSigner(
        VaultSigner,
        vaultClientConfig,
        secureKeyName,
        logger,
      );

      tezosService.setSigner(vaultSigner);

      try {
        const pkh = await vaultSigner.publicKeyHash();

        logger.info(
          { publicKeyHash: pkh, secureKeyName },
          '[api/storage/deploy-job-controller] This account requested to deploy a contract to Tezos',
        );
      } catch (e) {
        throw new ClientError({
          status: 404,
          message: `Error while fetching public key with the key name: ${secureKeyName}`,
        });
      }

      const contractData = storageObj
        ? await tezosService.deployContract(codeJson, undefined, storageObj)
        : await tezosService.deployContract(codeJson, storageJson);

      return res.status(StatusCodes.CREATED).json(contractData);
    } catch (err) {
      if (err instanceof ClientError) {
        return next(createHttpError(err.status, err.message));
      }

      return next(err);
    }
  };
}

/**
 * Will compile the code received.
 *
 * @param   {string} smartContractCode        - The smart contract code in Base64
 * @returns {string[]}                        - The code compiled in json and storage in json within a array of 2 entries
 */
async function compileSmartpy(smartContractCode: string): Promise<string[]> {
  const compilationSmartpyConfModified = {
    ...compilationSmartpyConf,
    contractPath: `${compilationSmartpyConf.contractDirectory}/${compilationSmartpyConf.contractName}`,
    codeJsonLocalPath: `${compilationSmartpyConf.contractDirectory}/*/step_000_cont_0_contract.json`,
    storageJsonLocalPath: `${compilationSmartpyConf.contractDirectory}/*/step_000_cont_0_storage.json`,
  };

  await fs.writeFileSync(
    compilationSmartpyConfModified.contractPath,
    smartContractCode,
    {
      encoding: 'base64',
    },
  );

  const smartpysh = spawn(compilationSmartpyConfModified.commandPath, [
    'compile',
    compilationSmartpyConfModified.contractPath,
    compilationSmartpyConfModified.contractDirectory,
  ]);

  return new Promise((resolve, reject) => {
    smartpysh
      .on('close', async (code) => {
        if (code !== 0)
          reject(
            new ClientError({
              status: 400,
              message:
                'smartpysh failed to compile, check the description of the prop smartContractCode in const/openapi or try to compile with SmartPy cli',
            }),
          );
        else {
          const codeJson = await getFileContents(
            compilationSmartpyConfModified.codeJsonLocalPath,
          );
          const storageJson = await getFileContents(
            compilationSmartpyConfModified.storageJsonLocalPath,
          );

          if (!codeJson || !storageJson)
            reject(
              `Can not find file ${compilationSmartpyConfModified.codeJsonLocalPath}`,
            );

          resolve([codeJson as string, storageJson as string]);
        }
      })
      .on('error', (err: Error) => {
        reject(
          new ClientError({
            status: 400,
            message: `An error has occurred while compiling: ${err.message}`,
          }),
        );
      });
  });
}

/**
 * Will fetch contents in a file with the {path} variable. Wild card syntax accepted
 *
 * @param   {string} path        - The path of a file
 * @returns {string | void}      - The content of the file if success
 */
async function getFileContents(path: string) {
  try {
    const [fileName] = await new Promise<string[]>(
      (resolvePromise, rejectPromise) => {
        glob(path, (err, matches) => {
          if (err) rejectPromise(err);
          return resolvePromise(matches);
        });
      },
    );

    return fs.readFileSync(fileName, 'utf8');
  } catch (e) {
    return;
  }
}

export default { compileAndDeployContract, compileSmartpy };
