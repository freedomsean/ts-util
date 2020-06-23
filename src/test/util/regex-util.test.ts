import { RegexUtil } from '../../util/regex-util';

describe('Test RegexUtil', () => {
  describe('Test getMatchPartVal', () => {
    test('Test getMatchPartVal with one matched part', () => {
      const regex = /foo(\w?)/g;
      const str = 'football baseball foosball';

      const result = RegexUtil.getMatchPartVal(regex, str);
      expect(result.length).toBe(2);
      expect(result).toEqual(expect.arrayContaining(['t', 's']));
    });

    test('Test getMatchPartVal with two matched part', () => {
      const regex = /o(\w?)bal(\w?)/g;
      const str = 'football baseball foosball';

      const result = RegexUtil.getMatchPartVal(regex, str, 2);
      expect(result.length).toBe(4);
      expect(result).toEqual(expect.arrayContaining(['t', 'l', 's', 'l']));
    });
  });
});
