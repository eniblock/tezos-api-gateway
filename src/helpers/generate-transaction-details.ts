import { EntryPointParams } from '../const/interfaces/forge-operation-params';
import { TransactionDetails } from '../const/interfaces/send-transactions-params';
import { contractAddress } from '../config';

/**
 * Generate transactions details based on the request parameter and url
 * This middleware is only used by the generated API routes
 *
 * @param {string} urlPath      - the url path
 * @param {object} parameters   - the parameters of the endpoint
 *
 * @return {object} The transaction detail
 */
export function generateTransactionDetails(
  urlPath: string,
  parameters?: EntryPointParams,
): TransactionDetails {
  // We take the string after the last '/', then we keep the substring before the '?' char
  const entryPoint = urlPath.split('/').pop()?.split('?')[0] || '';

  return {
    contractAddress,
    entryPoint,
    entryPointParams: parameters,
  };
}
