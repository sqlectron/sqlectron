import { join } from 'path';
import sinon from 'sinon';
import * as utils from '../../src/browser/core/utils';

const FIXTURE_PATH = join(__dirname, '../fixtures/browser/sqlectron.json');
const TMP_FIXTURE_PATH = join(__dirname, '../fixtures/browser/tmp.sqlectron.json');

/* eslint func-names: 0 */
export default {
  TMP_FIXTURE_PATH,

  getConfigPath: {
    install({ copyFixtureToTemp }: { copyFixtureToTemp?: boolean }): void {
      const sandbox = sinon.createSandbox();

      beforeEach(async () => {
        if (copyFixtureToTemp) {
          const data = await utils.readJSONFile(FIXTURE_PATH);
          await utils.writeJSONFile(TMP_FIXTURE_PATH, data);
        }
        sandbox.stub(utils, 'getConfigPath').returns(TMP_FIXTURE_PATH);
      });

      afterEach(() => sandbox.restore());
    },
  },
};
