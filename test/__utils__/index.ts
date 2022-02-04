import { IndexerEnum } from '../../src/const/interfaces/indexer';
import supertest from 'supertest';

/**
 * Calls /contract/{contract_address}/calls until the randomly selected indexer is the one passed as parameter
 *
 * @param   {string} url      - The url to call.
 * @param   {enum}   indexer  - The targeted indexer
 * @returns {object} request  - The test request object used to make the calls
 */
export async function callGetTransactionsWithIndexer(
  url: string,
  indexer: IndexerEnum,
  request: supertest.SuperTest<supertest.Test>,
): Promise<{ body: any; status: number }> {
  let { body, status } = await request.get(url);

  if (body[0].indexer !== indexer)
    ({ body, status } = await callGetTransactionsWithIndexer(
      url,
      indexer,
      request,
    ));

  return { body, status };
}
