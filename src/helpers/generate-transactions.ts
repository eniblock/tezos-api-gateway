import { EntryPointParams } from '../const/interfaces/forge-operation-params';
import { TransactionDetails } from '../const/interfaces/send-transactions-params';
import { contractAddress } from '../config';

/**
 * Generate transactions details base on the request parameter and url
 *
 * @param {object} parameters   - the parameters of the end points
 * @param {string} urlPath      - the url path
 *
 * @return {object} The transaction detail
 */
export function generateTransactionDetails(
  urlPath: string,
  parameters?: EntryPointParams,
): TransactionDetails {
  const entryPoint = urlPath.split('/')[2];

  return {
    contractAddress,
    entryPoint,
    entryPointParams: parameters,
  };
}
