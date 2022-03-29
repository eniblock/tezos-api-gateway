import nock from 'nock';
import * as userLib from '../../../../src/lib/user/sign-data';

describe('[lib/user-sign-data] sign data', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('#signData', () => {
    afterEach(() => {
      nock.cleanAll();
    });

    it('should correctly sign data and return the signature', async () => {
      const vaultNock1 = nock('http://localhost:8300')
        .post(`/v1/transit/sign/userId`)
        .reply(200, {
          request_id: '18577311-af78-b99a-2d9d-4224ea9a3dae',
          lease_id: '',
          renewable: false,
          lease_duration: 0,
          data: {
            signature:
              'vault:v1:z1kkEPA22prtT8FR0oDeFsDCm9AhviNI+voewd9+KarCREPPmVLYisOLtU3r6N7UgiKSFbqY29UdhJlZtE+5Aw==',
          },
          wrap_info: null,
          warnings: null,
          auth: null,
        });

      const result = await userLib.signData('userId', '0x026ab45e');

      vaultNock1.done();

      expect(result.signature).toEqual(
        'edsigtzw8a6vfJCnAC4Kh3BvBnRS21cEFVtL8t2r6ybQ1kdLHFVDpznmWccEaERpzerosEso9fedLgtkGPERsyQ3JY8RhyE2muj',
      );
      expect(result.signedData).toEqual(
        '0x026ab45ecf592410f036da9aed4fc151d280de16c0c29bd021be2348fafa1ec1df7e29aac24443cf9952d88ac38bb54debe8ded482229215ba98dbd51d849959b44fb903',
      );
    });
  });
});
