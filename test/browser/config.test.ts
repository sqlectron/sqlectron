import path from 'path';
import { describe, expect, it } from 'vitest';

import { config } from '../../src/browser/core';
import { decrypt } from '../../src/browser/core/crypto';
import { readJSONFile } from '../../src/browser/core/utils';
import { ConfigFile } from '../../src/common/types/config';
import { EncryptedPassword } from '../../src/common/types/server';

import utilsStub from './utils-stub';

const cryptoSecret = 'CHK`Ya91Hs{me!^8ndwPPaPPxwQ}`';

describe('config', () => {
  utilsStub.getConfigPath.install({ copyFixtureToTemp: true });

  describe('.prepare', () => {
    it('should include id for those servers without it', async () => {
      const findItem = (data) => data.servers.find((srv) => srv.name === 'without-id');

      const fixtureBefore = await loadConfig();
      await config.prepare(cryptoSecret);
      const fixtureAfter = await loadConfig();

      expect(findItem(fixtureBefore)).not.toHaveProperty('id');
      expect(findItem(fixtureAfter)).toHaveProperty('id');
      const expected = await readJSONFile<ConfigFile>(
        path.join(__dirname, '../fixtures/browser/sqlectron.prepared.json'),
      );
      expect(fixtureAfter.servers).toHaveLength(expected.servers.length);
      fixtureAfter.servers[0].id = expected.servers[0].id;
      for (let i = 0; i < fixtureAfter.servers.length; i++) {
        const expectedServer = expected.servers[i];
        const actualServer = fixtureAfter.servers[i];
        if (expectedServer.password) {
          expect(decrypt(expected.servers[i].password as EncryptedPassword, cryptoSecret)).toBe(
            decrypt(actualServer.password as EncryptedPassword, cryptoSecret),
          );
          expectedServer.password = '';
          actualServer.password = '';
        }

        if (expectedServer.ssh && expectedServer.ssh.password) {
          expect(decrypt(expectedServer.ssh.password as EncryptedPassword, cryptoSecret)).toBe(
            decrypt(actualServer.ssh!.password as EncryptedPassword, cryptoSecret),
          );
          expectedServer.ssh.password = '';
          actualServer.ssh!.password = '';
        }

        expect(expectedServer).toEqual(actualServer);
      }
    });
  });

  function loadConfig() {
    return readJSONFile<ConfigFile>(utilsStub.TMP_FIXTURE_PATH);
  }
});
