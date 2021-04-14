import { generateTransactionDetails } from '../../../src/helpers/generate-transactions';

describe('[helpers/generate-transactions]', () => {
  describe('#generateTransactionDetails', () => {
    it('should correctly return the transaction details', () => {
      expect(generateTransactionDetails('/forge/transfer')).toEqual({
        contractAddress: 'KT1Nk7KLuuWJz8muPN1hFZhFtneepKNAsJSU',
        entryPoint: 'transfer',
      });
    });
  });
});
