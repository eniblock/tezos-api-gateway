import { Signer, TezosToolkit } from '@taquito/taquito';
import { BlockResponse, OperationContentsTransaction } from '@taquito/rpc';
import { OriginationOperation } from '@taquito/taquito/dist/types/operations/origination-operation';

import { ForgeOperationResult } from '../const/interfaces/forge-operation-result';
import cacheLocal from '../services/cache-local';
import { OperationContentsReveal } from '@taquito/rpc/dist/types/types';
import { VaultSigner } from './signers/vault';

export class TezosService {
  private _tezos: TezosToolkit;

  constructor(rpcUrl: string) {
    this._tezos = new TezosToolkit(rpcUrl);
  }

  public get rpcClient() {
    return this._tezos.rpc;
  }

  public get tezos() {
    return this._tezos;
  }

  public setSigner(signer: Signer) {
    this._tezos.setSignerProvider(signer);
  }

  public createBatch() {
    return this._tezos.batch();
  }

  public async getContract(contractAddress: string) {
    const contract = this._tezos.contract.at(contractAddress);
    let keyToCache = contractAddress;

    if (this.tezos.signer instanceof VaultSigner) {
      const pkh = await this.tezos.signer.publicKeyHash();
      // As the signer is included in the contract object,
      // we store the contract with the signer's pkh to retrieve the right contract instance
      keyToCache = `${contractAddress}-${pkh}`;
    }
    cacheLocal.set(keyToCache, contract);
    return contract;
  }

  public async getContractFromCache(contractAddress: string) {
    let keyToCache = contractAddress;
    if (this.tezos.signer instanceof VaultSigner) {
      const pkh = await this.tezos.signer.publicKeyHash();
      keyToCache = `${contractAddress}-${pkh}`;
    }
    let contract = cacheLocal.get<any>(keyToCache);
    if (contract === undefined)
      contract = await this.getContract(contractAddress);
    return contract;
  }

  public async getContractResponse(address: string) {
    return this.rpcClient.getContract(address);
  }

  public getLatestBlock(): Promise<BlockResponse> {
    return this.rpcClient.getBlock();
  }

  public async forgeOperations(
    forgeParams: (OperationContentsTransaction | OperationContentsReveal)[],
  ): Promise<ForgeOperationResult> {
    const { hash: branch } = await this.rpcClient.getBlockHeader();
    const forgedOperation = await this.rpcClient.forgeOperations({
      branch,
      contents: forgeParams,
    });

    return { branch, forgedOperation };
  }

  public async preapplyOperations(
    branch: string,
    forgeParams: (OperationContentsTransaction | OperationContentsReveal)[],
    signature: string,
  ) {
    const protocol = (await this._tezos.rpc.getBlockMetadata()).next_protocol;
    return this._tezos.rpc.preapplyOperations([
      {
        branch,
        contents: forgeParams,
        protocol,
        signature,
      },
    ]);
  }

  public async injectedOperations(signedOpBytes: string) {
    return this._tezos.rpc.injectOperation(signedOpBytes);
  }

  /**
   *
   * @description Originate a new contract according to codeJson and storageJson in parameters.
   * Will sign and inject an operation using the _tezos (TezosToolkit) context.
   *
   * @returns An operation hash and contract address from the rpc node
   *
   * @param {string} codeJson - The compiled contract code in JSON.
   *
   * @param {string} storageJson - The compiled contract storage in JSON.
   */
  public async deployContract(codeJson: string, storageJson: string) {
    const operation: OriginationOperation = await this._tezos.contract.originate(
      {
        code: JSON.parse(codeJson),
        init: JSON.parse(storageJson),
      },
    );
    const operationHash = operation.hash;
    const contract = await operation.contract();

    return {
      operation_hash: operationHash,
      contract_address: contract.address,
    };
  }
}
