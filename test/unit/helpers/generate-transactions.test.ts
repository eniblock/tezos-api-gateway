import { generateTransactionDetails } from '../../../src/helpers/generate-transactions';
import { flexibleTokenContract } from '../../__fixtures__/smart-contract';

describe('[helpers/generate-transactions]', () => {
  describe('#generateTransactionDetails', () => {
    it('should correctly return the transaction details', () => {
      expect(generateTransactionDetails('/forge/transfer')).toEqual({
        contractAddress: flexibleTokenContract,
        entryPoint: 'transfer',
      });
    });
  });
});
