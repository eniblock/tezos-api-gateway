import { generateRandomInt } from '../../../src/utils';

describe('[utils/index]', () => {
  describe('#generateRandomInt', () => {
    it('should always generate an random integer greater than 0 and smaller than max value', () => {
      const randomInt = generateRandomInt(5);
      expect(randomInt).toBeGreaterThanOrEqual(0);
      expect(randomInt).toBeLessThan(5);
    });
  });
});
