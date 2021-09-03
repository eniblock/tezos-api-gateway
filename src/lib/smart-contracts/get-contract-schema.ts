import { TezosService } from '../../services/tezos';

/**
 * Get the smart contract parameter schema
 *
 * @param {object} tezosService    - the service to interact with Tezos
 * @param {string} contractAddress - the smart contract address
 *
 * @return {object} the parameter schema
 */
export async function getContractParameterSchema(
  tezosService: TezosService,
  contractAddress: string,
) {
  // We don't use getContractFromCache() because it would cache the contract with the wrong signer (NoopSigner)
  const contract = await tezosService.getContract(contractAddress);

  return contract.parameterSchema.ExtractSchema();
}
