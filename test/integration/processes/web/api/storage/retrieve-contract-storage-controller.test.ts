import supertest from 'supertest';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import { TezosService } from '../../../../../../src/services/tezos';
import { logger } from '../../../../../../src/services/logger';
import * as getContractStorageLib from '../../../../../../src/lib/storage/get-contract-storage';

import {
  postgreConfig,
  serverConfig,
  tezosNodeUrl,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';
import {
  FA2Contract3,
  FA2Contract5,
  flexibleTokenContract,
  testAccount,
  testAccount2,
} from '../../../../../__fixtures__/smart-contract';

describe('[processes/web/api/storage] Retrieve Contract Storage Controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const tezosService = new TezosService(tezosNodeUrl);
  const postgreService = new PostgreService(postgreConfig);

  webProcess.postgreService = postgreService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
  });

  beforeEach(() => {
    jest
      .spyOn(webProcess.gatewayPool, 'getTezosService')
      .mockResolvedValue(tezosService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#retrieveContractStorageFromTezosNode', () => {
    it('should return 400 when the contract address does not have a good format', async () => {
      const { body, status } = await request
        .post('/api/tezos_node/storage/123')
        .set('Content-Type', 'application/json')
        .send();

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          'request.params.contract_address should match pattern "^KT+[0-9a-zA-Z]{34}$"',
        status: 400,
      });
    });

    it('should return 400 when the dataFields parameter has unexpected format', async () => {
      const { body, status } = await request
        .post('/api/tezos_node/storage/' + FA2Contract3)
        .set('Content-Type', 'application/json')
        .send({
          dataFields: [
            {
              key: 'toto',
            },
          ],
        });

      expect(status).toEqual(400);
      expect(body).toEqual({
        message:
          '[{"keyword":"type","dataPath":"/0","schemaPath":"#/items/oneOf/0/type","params":{"type":"string"},"message":"should be string"},' +
          '{"keyword":"type","dataPath":"/0/key","schemaPath":"#/items/oneOf/1/patternProperties/%5B%5Cw_-%5D/type","params":{"type":"array"},"message":"should be array"},' +
          '{"keyword":"oneOf","dataPath":"/0","schemaPath":"#/items/oneOf","params":{"passingSchemas":null},"message":"should match exactly one schema in oneOf"}]',
        status: 400,
      });
    });

    it('should return 404 when the contract address does not exist', async () => {
      const { body, status } = await request
        .post('/api/tezos_node/storage/' + FA2Contract5)
        .set('Content-Type', 'application/json')
        .send();

      expect(status).toEqual(404);
      expect(body).toEqual({
        message: 'Http error response: (404) ',
        status: 404,
      });
    });

    it('should return 500 when unexpected error happen', async () => {
      const getContractStorageSpy = jest
        .spyOn(getContractStorageLib, 'getContractStorageObjectFromTezosNode')
        .mockRejectedValue(new Error());

      const { body, status } = await request
        .post('/api/tezos_node/storage/' + FA2Contract3)
        .set('Content-Type', 'application/json')
        .send();

      expect(status).toEqual(500);
      expect(body).toEqual({
        message: 'Internal Server Error',
        status: 500,
      });

      expect(getContractStorageSpy.mock.calls).toEqual([
        [logger, tezosService, FA2Contract3, undefined],
      ]);
    });

    it('should return 200 and all storage if dataFields is not defined', async () => {
      const { body, status } = await request
        .post('/api/tezos_node/storage/' + FA2Contract3)
        .set('Content-Type', 'application/json')
        .send();

      expect({ status, body }).toMatchObject({
        status: 200,
        body: {
          accessRequests: {
            type: 'big_map',
          },
          organizations: [
            {
              key: {
                address: testAccount2,
                jwtToken: 'jwt',
              },
              value: {
                name: 'toto',
                publicKey: 'toto public key',
                publicKeyHash: testAccount2,
                datasources: [
                  {
                    key: 'datasource1',
                    value: 'value1',
                  },
                  {
                    key: 'datasource2',
                    value: 'value2',
                  },
                  {
                    key: 'datasource3',
                    value: 'value3',
                  },
                ],
              },
            },
            {
              key: {
                address: testAccount,
                jwtToken: 'jwt',
              },
              value: {
                name: 'tata',
                publicKey: 'tata public key',
                publicKeyHash: testAccount,
                datasources: [
                  {
                    key: 'datasource4',
                    value: 'value4',
                  },
                  {
                    key: 'datasource5',
                    value: 'value5',
                  },
                  {
                    key: 'datasource6',
                    value: 'value6',
                  },
                ],
              },
            },
          ],
        },
      });
    });

    it('should return 200 but with proper error message in storage object if a field does not exist', async () => {
      const { body, status } = await request
        .post('/api/tezos_node/storage/' + FA2Contract3)
        .set('Content-Type', 'application/json')
        .send({
          dataFields: ['accessRequests', 'name'],
        });

      expect({ status, body }).toMatchObject({
        status: 200,
        body: {
          accessRequests: {
            type: 'big_map',
          },
          name: {
            error: 'This data field does not exist in the contract storage',
          },
        },
      });
    });

    it('should return 200 and correctly access a map', async () => {
      const { body, status } = await request
        .post('/api/tezos_node/storage/' + FA2Contract3)
        .set('Content-Type', 'application/json')
        .send({
          dataFields: [
            {
              organizations: [
                {
                  key: {
                    address: testAccount,
                    jwtToken: 'jwt',
                  },
                },
              ],
            },
          ],
        });

      expect({ status, body }).toEqual({
        status: 200,
        body: {
          organizations: [
            {
              key: {
                address: testAccount,
                jwtToken: 'jwt',
              },
              value: {
                name: 'tata',
                publicKey: 'tata public key',
                publicKeyHash: testAccount,
                datasources: [
                  {
                    key: 'datasource4',
                    value: 'value4',
                  },
                  {
                    key: 'datasource5',
                    value: 'value5',
                  },
                  {
                    key: 'datasource6',
                    value: 'value6',
                  },
                ],
              },
            },
          ],
        },
      });
    });

    it('should return 200 and correctly access a map and only return required fields', async () => {
      const { body, status } = await request
        .post('/api/tezos_node/storage/' + FA2Contract3)
        .set('Content-Type', 'application/json')
        .send({
          dataFields: [
            {
              organizations: [
                {
                  key: {
                    address: testAccount,
                    jwtToken: 'jwt',
                  },
                  dataFields: ['name'],
                },
              ],
            },
          ],
        });

      expect({ status, body }).toEqual({
        status: 200,
        body: {
          organizations: [
            {
              key: {
                address: testAccount,
                jwtToken: 'jwt',
              },
              value: {
                name: 'tata',
              },
            },
          ],
        },
      });
    });

    it('should return 200 but with a proper error message when trying to access a NOT MAP data field with MAP ACCESS structure', async () => {
      const { body, status } = await request
        .post('/api/tezos_node/storage/' + flexibleTokenContract)
        .set('Content-Type', 'application/json')
        .send({
          dataFields: [
            {
              decimals: [
                {
                  key: {
                    address: testAccount,
                  },
                },
              ],
            },
          ],
        });

      expect({ status, body }).toEqual({
        status: 200,
        body: {
          decimals: {
            error:
              'This data field does not have type MichelsonMap or BigMap, use simple string to access to the properties',
          },
        },
      });
    });

    it('should return 200 and correctly access big map', async () => {
      const { body, status } = await request
        .post('/api/tezos_node/storage/' + flexibleTokenContract)
        .set('Content-Type', 'application/json')
        .send({
          dataFields: [
            {
              balances: [
                {
                  key: 'tz1hdQscorfqMzFqYxnrApuS5i6QSTuoAp3w',
                },
              ],
            },
          ],
        });

      expect({ status, body }).toEqual({
        status: 200,
        body: {
          balances: [
            {
              key: 'tz1hdQscorfqMzFqYxnrApuS5i6QSTuoAp3w',
              value: 40,
            },
          ],
        },
      });
    });
  });
});
