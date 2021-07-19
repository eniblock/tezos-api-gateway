import Logger from 'bunyan';

import { TezosService } from '../../services/tezos';
import { InvalidEntryPoint } from '../../const/errors/invalid-entry-point';
import _ from 'lodash';

/**
 * Get the schema of the contract entry points from tezos node by using taquito
 * The function returns the schema of all the contract entry points if no one is mentioned
 *
 * For example:
 * contractAddress = 'KT1NjK4eGjLbWHB1M75tGbAsPatPCLudTKp1'
 * entryPoints = ['mint', 'update_operators']
 *
 * => {
 *       schema: [
 *         {
 *           entryPoint: 'mint',
 *           schema: {
 *             address: 'address',
 *             amount: 'nat',
 *             metadata: {
 *               map: {
 *                 key: 'string',
 *                 value: 'bytes',
 *               },
 *             },
 *             token_id: 'nat',
 *           },
 *           michelson: {
 *             prim: 'pair',
 *             args: [
 *               {
 *                 prim: 'pair',
 *                 args: [
 *                   { prim: 'address', annots: ['%address'] },
 *                   { prim: 'nat', annots: ['%amount'] },
 *                 ],
 *               },
 *               {
 *                 prim: 'map',
 *                 args: [{ prim: 'string' }, { prim: 'bytes' }],
 *                 annots: ['%metadata'],
 *               },
 *               { prim: 'nat', annots: ['%token_id'] },
 *             ],
 *           },
 *         },
 *         {
 *           entryPoint: 'update_operators',
 *           schema: 'list',
 *           michelson: {
 *             prim: 'list',
 *             args: [
 *               {
 *                 prim: 'or',
 *                 args: [
 *                   {
 *                     prim: 'pair',
 *                     args: [
 *                       { prim: 'address', annots: ['%owner'] },
 *                       { prim: 'address', annots: ['%operator'] },
 *                       { prim: 'nat', annots: ['%token_id'] },
 *                     ],
 *                     annots: ['%add_operator'],
 *                   },
 *                   {
 *                     prim: 'pair',
 *                     args: [
 *                       { prim: 'address', annots: ['%owner'] },
 *                       { prim: 'address', annots: ['%operator'] },
 *                       { prim: 'nat', annots: ['%token_id'] },
 *                     ],
 *                     annots: ['%remove_operator'],
 *                   },
 *                 ],
 *               },
 *             ],
 *           },
 *         },
 *       ],
 *       contractEntryPointsList: [
 *         'balance_of',
 *         'mint',
 *         'set_administrator',
 *         'set_metadata',
 *         'set_pause',
 *         'transfer',
 *         'update_operators',
 *       ],
 *     }
 *
 *
 * @param { string } contractAddress  - The smart contract object
 * @param { string[] } entryPoints    - The list of entry points' names
 *
 * @return Promise<object> the schema object
 */
export async function getEntryPointSchemaFromTezosNode(
  logger: Logger,
  tezosService: TezosService,
  contractAddress: string,
  entryPoints?: string[],
) {
  logger.info(
    { contractAddress, entryPoints },
    '[lib/entrypoints/get-entrypoint-schema/#getEntryPointSchemaFromTezosNode] Retrieve' +
      " the schema for the smart contract's entrypoint",
  );

  const contract = await tezosService.getContractFromCache(contractAddress);

  const schema = contract.parameterSchema.ExtractSchema();

  const entryPointList = Object.keys(schema);

  if (_.isEmpty(entryPoints)) {
    entryPoints = entryPointList;
  }

  const schemas = entryPoints!!.map((entryPoint) => {
    if (!entryPointList.includes(entryPoint)) {
      throw new InvalidEntryPoint(entryPointList, entryPoint);
    }
    return {
      entryPoint,
      schema: schema[`${entryPoint}`],
      michelson: contract.entrypoints.entrypoints[`${entryPoint}`],
    };
  });

  return {
    schema: schemas,
    contractEntryPointsList: entryPointList,
  };
}
