import { deleteObjectSubLevel } from '../../../src/helpers/filter-object';

describe('[helpers/filter-object]', () => {
  describe('#deleteObjectSubLevel', () => {
    let obj = {};

    beforeEach(() => {
      obj = {
        a: 'a',
        b: {
          c: 'c',
          d: {
            e: {
              f: 'f',
              g: 'g',
            },
            h: 'h',
            b: {
              i: 'i',
              j: 'j',
            },
          },
        },
      };
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should remove one sub-level object and replace it with its children', () => {
      expect(deleteObjectSubLevel(obj, 'd')).toEqual({
        a: 'a',
        b: {
          c: 'c',
          e: {
            f: 'f',
            g: 'g',
          },
          h: 'h',
          b: {
            i: 'i',
            j: 'j',
          },
        },
      });
    });

    it('should remove all occurrences of sub-level object and replace it with its children', () => {
      expect(deleteObjectSubLevel(obj, 'b')).toEqual({
        a: 'a',
        c: 'c',
        d: {
          e: {
            f: 'f',
            g: 'g',
          },
          h: 'h',
          i: 'i',
          j: 'j',
        },
      });
    });
  });
});
