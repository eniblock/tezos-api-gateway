import * as userLib from '../../../../src/lib/user/get-user-by-address';
import nock from 'nock';

describe('[lib/user/get-user-by-address]', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#getUserByAddress', () => {
    it('should return the account addresses of the specified user ids', async () => {
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

      const accounts = await userLib.getUserByAddress(['address1', 'address2']);

      vaultNock1.done();
      vaultNock2.done();

      expect(accounts[0].userId).toEqual('key1');
      expect(accounts[0].account).toMatch('address1');
      expect(accounts[1].userId).toEqual('key2');
      expect(accounts[1].account).toMatch('address2');
    });

    it('should throw an error and log error if unexpected error happened', async () => {
      jest
        .spyOn(userLib, 'getUserByAddress')
        .mockRejectedValue(new Error('Unexpected error'));

      await expect(
        userLib.getUserByAddress(['address1', 'address2']),
      ).rejects.toThrow(Error('Unexpected error'));
    });

    it('should return a null userId for an unknown address', async () => {
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
      const accounts = await userLib.getUserByAddress(['address1', 'address3']);

      vaultNock1.done();
      vaultNock3.done();

      expect(accounts[0].account).toMatch('address1');
      expect(accounts[0].userId).toEqual('key1');
      expect(accounts[1].account).toEqual('address3');
      expect(accounts[1].userId).toEqual(null);
    });
  });
});
