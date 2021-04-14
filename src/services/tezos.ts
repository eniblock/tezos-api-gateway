import { Signer, TezosToolkit } from '@taquito/taquito';
import { BlockResponse, OperationContentsTransaction } from '@taquito/rpc';

import { ForgeOperationResult } from '../const/interfaces/forge-operation-result';

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
    return this._tezos.contract.at(contractAddress);
  }

  public async getContractResponse(address: string) {
    return this.rpcClient.getContract(address);
  }

  public getLatestBlock(): Promise<BlockResponse> {
    return this.rpcClient.getBlock();
  }

  public async forgeOperations(
    forgeParams: OperationContentsTransaction[],
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
    forgeParams: OperationContentsTransaction[],
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
}
