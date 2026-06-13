import { describe, expect, it } from 'vitest';

import { titlize } from '../../../src/common/utils/string';

describe('titlize', () => {
  [
    ['test', 'Test'],
    ['TEST', 'Test'],
    ['Test', 'Test'],
  ].forEach(([input, expected]) => {
    it(`should convert ${input} to ${expected}`, () => {
      expect(titlize(input)).toBe(expected);
    });
  });
});
