import { expect } from 'chai';

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
      expect(escapeRegExpString(input)).to.eql(expected);
    });
  });
});
