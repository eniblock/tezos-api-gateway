import supertest from 'supertest';

import { WebProcess } from '../../../../../../src/processes/web/web-process';
import * as getUserByAddressLib from '../../../../../../src/lib/user/get-user-by-address';

import {
  postgreConfig,
  serverConfig,
} from '../../../../../__fixtures__/config';
import { PostgreService } from '../../../../../../src/services/postgre';
import nock from 'nock';

describe('[processes/web/api/user/address] Get User By Address Controller', () => {
  const webProcess = new WebProcess({ server: serverConfig });
  const postgreService = new PostgreService(postgreConfig);

  webProcess.postgreService = postgreService;

  const request: supertest.SuperTest<supertest.Test> = supertest(
    webProcess.app,
  );

  beforeAll(async () => {
    await webProcess.start();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await webProcess.stop();
  });

  describe('#getUserByAddressController', () => {
    it('should return 400 when the query parameter userAddressList is missing', async () => {
      const { body, status } = await request.get('/api/user/address');

      expect(status).toEqual(400);
      expect(body).toEqual({
        message: "request.query should have required property 'userAddressList'",
        status: 400,
      });
    });

    it('should return 500 when unexpected error happen', async () => {
      jest
        .spyOn(getUserByAddressLib, 'getUserByAddress')
        .mockRejectedValue(new Error());

      const { body, status } = await request.get('/api/user/address').query({
        userAddressList: ['address1', 'address2'],
      });

      expect(status).toEqual(500);
      expect(body).toEqual({
        message: 'Internal Server Error',
        status: 500,
      });
    });

    it('should return 200 and the account addresses of the specified user ids', async () => {
      const vaultNock1 = nock('http://localhost:8300')
          .get(`/v1/secret/data/accounts/address1`)
          .reply(200, {
            request_id: '649060e4-f75c-d752-1b6d-7a8f09511770',
            lease_id: '',
            renewable: false,
            lease_duration: 0,
            data: {
              data: {
                userId: 'key1',
              },
              metadata: {
                created_time: '2021-05-27T15:47:10.39315826Z',
                deletion_time: '',
                destroyed: false,
                version: 1,
              },
            },
            wrap_info: null,
            warnings: null,
            auth: null,
          });
      const vaultNock2 = nock('http://localhost:8300')
          .get(`/v1/secret/data/accounts/address2`)
          .reply(200, {
            request_id: '649060e4-f75c-d752-1b6d-7a8f09511770',
            lease_id: '',
            renewable: false,
            lease_duration: 0,
            data: {
              data: {
                userId: 'key2',
              },
              metadata: {
                created_time: '2021-05-27T15:47:10.39315826Z',
                deletion_time: '',
                destroyed: false,
                version: 1,
              },
            },
            wrap_info: null,
            warnings: null,
            auth: null,
          });

      const { body, status } = await request.get('/api/user/address').query({
        userAddressList: ['address1', 'address2'],
      });

      vaultNock1.done();
      vaultNock2.done();

      expect(status).toEqual(200);
        expect(body[0].userId).toEqual('key1');
        expect(body[0].account).toMatch('address1');
        expect(body[1].userId).toEqual('key2');
        expect(body[1].account).toMatch('address2');
    });

    it('should return 200 and a null userId for an unknown address', async () => {
      const vaultNock1 = nock('http://localhost:8300')
          .get(`/v1/secret/data/accounts/address1`)
          .reply(200, {
            request_id: '649060e4-f75c-d752-1b6d-7a8f09511770',
            lease_id: '',
            renewable: false,
            lease_duration: 0,
            data: {
              data: {
                userId: 'key1',
              },
              metadata: {
                created_time: '2021-05-27T15:47:10.39315826Z',
                deletion_time: '',
                destroyed: false,
                version: 1,
              },
            },
            wrap_info: null,
            warnings: null,
            auth: null,
          });
      const vaultNock3 = nock('http://localhost:8300')
          .get(`/v1/secret/data/accounts/address3`)
          .reply(404);

      const { body, status } = await request.get('/api/user/address').query({
        userAddressList: ['address1', 'address3'],
      });

      vaultNock1.done();
      vaultNock3.done();

      expect(status).toEqual(200);
        expect(body[0].userId).toEqual('key1');
        expect(body[0].account).toMatch('address1');
        expect(body[1].userId).toEqual(null);
        expect(body[1].account).toMatch('address3');
    });
  });
});
