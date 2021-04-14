import { parseInt } from '../../../src/utils/parse-int';

describe('[utils/parse-int]', () => {
  describe('#parseInt', () => {
    it('should return the default value if the value is undefined', () => {
      expect(parseInt(10, undefined)).toEqual(10);
    });

    it('should return the default value if the value not a number', () => {
      expect(parseInt(10, 'not a number')).toEqual(10);
    });

    it('should return value as number', () => {
      expect(parseInt(10, '20')).toEqual(20);
    });
  });
});
