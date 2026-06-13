import { describe, expect, it } from 'vitest';

import { escapeRegExpString } from '../../../src/renderer/utils/regexp';

describe('escapeRegExpString', () => {
  [
    ['a', 'a'],
    ['[', '\\['],
    [']', '\\]'],
    ['(', '\\('],
    [')', '\\)'],
  ].forEach(([input, expected]) => {
    it(`should escape regexp string: ${input}`, () => {
      expect(escapeRegExpString(input)).toEqual(expected);
    });
  });
});
