import { join } from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getConfigPath } from '../../src/browser/core/utils';

describe('utils', () => {
  describe('.getConfigPath', () => {
    describe('use of SQLECTRON_HOME', () => {
      let env: NodeJS.ProcessEnv;

      beforeAll(() => {
        env = process.env;
        process.env = { SQLECTRON_HOME: '/path/to/env' };
      });

      it('should get config from process.env.SQLECTRON_HOME', () => {
        expect(getConfigPath()).toEqual(
          join(process.env.SQLECTRON_HOME as string, 'sqlectron.json'),
        );
      });

      afterAll(() => {
        process.env = env;
      });
    });
  });
});
