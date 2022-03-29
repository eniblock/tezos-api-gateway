import * as signLib from '../../../../src/lib/test/sign-with-in-memory-signer';
jest.mock('../../../../src/services/signers/vault');

describe("[lib/test] Sign with taquito's in memory signer", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('signWithInMemorySigner', () => {
    it('should return the signed operation', async () => {
      const result = await signLib.signWithInMemorySigner(
        'edskRyv5wj1Nwff8sFZ5VnPjrYev5a4nccFnjj2GLijoofiv7dZupV5upi9S3iB8pw41oGqmxwh65kapGR6b4vw9cPGMLKmydg',
        'aa0f73bccbe62ab8d075f94a4c03583d47c349c1cd5747676e093a70d524fa776c005df8ceced07a0074dc1c3b17de65e19bdb8ce70ca08d068feb4a80ea30d0860300010d6eb7444a321cbddc4787b6a1714ab1789e772d00ffff087472616e736665720000002d07070100000024747a315a51594d4445546f644e42416332585662685a46476d65384b6e697550717253770001',
        true,
      );

      expect(result).toEqual({
        signedOperation:
          'aa0f73bccbe62ab8d075f94a4c03583d47c349c1cd5747676e093a70d524fa776c005df8ceced07a0074dc1c3b17de65e19bdb8ce70ca08d068feb4a80ea30d0860300010d6eb7444a321cbddc4787b6a1714ab1789e772d00ffff087472616e736665720000002d07070100000024747a315a51594d4445546f644e42416332585662685a46476d65384b6e6975507172537700019ac2cb873dcd4a5054971de9e8bed73f71aaedc417b8a539860b8876963d2bf8cf00caeb82fcfbcf63ea99ab315451449e73264e96d6d9c3310196330aa53201',
        signature:
          'edsigtt46YD5AhVthPmaZWNFtAMd9a3uKuBdoiUu3wbgEeMgS7wFRFbte5NkajsvkKkdhfbWiKosPfhCGVKJzHw4uWAzHtBQgcV',
      });
    });

    it('should return the signed data without appending with the operation prefix', async () => {
      const result = await signLib.signWithInMemorySigner(
        'edskRyv5wj1Nwff8sFZ5VnPjrYev5a4nccFnjj2GLijoofiv7dZupV5upi9S3iB8pw41oGqmxwh65kapGR6b4vw9cPGMLKmydg',
        'aa0f73bccbe62ab8d075f94a4c03583d47c349c1cd5747676e093a70d524fa776c005df8ceced07a0074dc1c3b17de65e19bdb8ce70ca08d068feb4a80ea30d0860300010d6eb7444a321cbddc4787b6a1714ab1789e772d00ffff087472616e736665720000002d07070100000024747a315a51594d4445546f644e42416332585662685a46476d65384b6e697550717253770001',
        false,
      );

      expect(result).toEqual({
        signedOperation:
          'aa0f73bccbe62ab8d075f94a4c03583d47c349c1cd5747676e093a70d524fa776c005df8ceced07a0074dc1c3b17de65e19bdb8ce70ca08d068feb4a80ea30d0860300010d6eb7444a321cbddc4787b6a1714ab1789e772d00ffff087472616e736665720000002d07070100000024747a315a51594d4445546f644e42416332585662685a46476d65384b6e69755071725377000141d201034e63ad0cf9b2419f54bd89e2d25dc474319ed15766781f5637daaedc173a559677734299b650e71fbbd5416fbc8998efbc1882b1f510464e80284205',
        signature:
          'edsigtgRDAVXsqBRWwdwWaVGQgsKdx7xbhCBv6fXidnwiSm5HwrKDnNHHfhFBVqGLfs66zt9Pfi8ZDRtqJcJgLrNRhQrN9cV3nN',
      });
    });
  });
});
