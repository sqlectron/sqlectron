import fs from 'fs';
import path from 'path';
import type { ElectronApplication, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import helper from './helper';

describe('MainWindow', () => {
  let app: ElectronApplication;
  let mainWindow: Page;

  beforeAll(async () => {
    // Makes a copy of the file, because the app writes to it during the startup
    // which has a slight different format than we use with prettier and it causes
    // an unecessary change to be commited everytime the test runs.
    fs.copyFileSync(
      path.join(__dirname, '../fixtures/simple/sqlectron-sample.json'),
      path.join(__dirname, '../fixtures/simple/sqlectron.json'),
    );

    const res = await helper.startApp({
      sqlectronHome: path.join(__dirname, '../fixtures/simple'),
    });

    app = res.app;
    mainWindow = res.mainWindow;
  });

  afterAll(async () => {
    await helper.endApp(app);
  });

  it('script application', async () => {
    const appPath = await app.evaluate(({ app }) => {
      // This runs in the main Electron process, first parameter is
      // the result of the require('electron') in the main app script.
      return app.getAppPath();
    });

    if (process.env.DEV_MODE === 'true') {
      expect(appPath).toBe(path.join(__dirname, '../../src/browser'));
    } else {
      expect(appPath).toBe(path.join(__dirname, '../../out/browser'));
    }
  });

  it('load servers from configuration file', async () => {
    await mainWindow.waitForSelector('#server-list');

    const list = await mainWindow.$$('#server-list [data-testid="server-name"]');
    expect(list).toHaveLength(1);

    await helper.expectToEqualText(
      mainWindow,
      '#server-list [data-testid="server-name"]',
      'sqlectron-local-dev',
    );
    await helper.expectToEqualText(
      mainWindow,
      '#server-list [data-testid="server-meta"]',
      'localhost:3306',
    );
  });
});
