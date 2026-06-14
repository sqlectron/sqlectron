import fs from 'fs';
import path from 'path';
import { ElectronApplication, Page } from 'playwright-core';
import sqlite3 from 'sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import helper from './helper';

const BASE_PATH = path.join(__dirname, '../fixtures/sqlite');
const DB_PATH = path.join(BASE_PATH, 'test.db');
const CONFIG_SAMPLE_PATH = path.join(BASE_PATH, 'sample-sqlectron.json');
const CONFIG_PATH = path.join(BASE_PATH, 'sqlectron.json');

function setupDB() {
  // Drop database
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  // Set DB path, it is required because sqlectron only suports absolute path
  const configSample = fs.readFileSync(CONFIG_SAMPLE_PATH, { encoding: 'utf8' });
  const config = JSON.parse(configSample);
  config.servers[0].database = DB_PATH;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

  // Create database
  const db = new sqlite3.Database(DB_PATH);

  db.serialize(function () {
    db.run('CREATE TABLE document (info TEXT)');

    const stmt = db.prepare('INSERT INTO document VALUES (?)');
    for (let i = 0; i < 10; i++) {
      stmt.run('Ipsum ' + i);
    }
    stmt.finalize();
  });

  return db;
}

describe('Sqlite', () => {
  let db;
  let app: ElectronApplication;
  let mainWindow: Page;

  beforeAll(async () => {
    db = setupDB();

    const res = await helper.startApp({
      sqlectronHome: BASE_PATH,
    });

    app = res.app;
    mainWindow = res.mainWindow;
  });

  afterAll(async () => {
    await helper.endApp(app);
    db.close();
  });

  it('should connect and run basic actions', async () => {
    await mainWindow.waitForSelector('#server-list');

    const list = await mainWindow.$$('#server-list [data-testid="server-name"]');
    expect(list).toHaveLength(1);

    await helper.expectToEqualText(
      mainWindow,
      '#server-list [data-testid="server-name"]',
      'sqlite-test',
    );
    await helper.expectToEqualText(
      mainWindow,
      '#server-list [data-testid="connect-button"]',
      'Connect',
    );

    const btnConnect = await mainWindow.$('#server-list [data-testid="connect-button"]');
    if (!btnConnect) {
      throw new Error('Could not find connect button');
    }
    // TODO: replace dispatchEvent('click') with the click method when we upgrade the electron app.
    // https://github.com/microsoft/playwright/issues/1042
    await btnConnect.dispatchEvent('click');

    await mainWindow.waitForSelector('#sidebar [data-testid="db-item-Table"]');
    const tables = await mainWindow.$$('#sidebar [data-testid="db-item-Table"]');
    expect(tables).toHaveLength(1);
    expect(await tables[0].innerText()).toBe('document');

    // Clicks in the table to run default select query
    const btnTable = await mainWindow.$('#sidebar [data-testid="db-item-Table"] span');
    if (!btnTable) {
      throw new Error('Could not find table button');
    }
    await btnTable.dispatchEvent('click');

    await mainWindow.waitForSelector('.react-tabs__tab-panel #query-result');

    // Set default query and automatically executes it
    await helper.expectToEqualText(
      mainWindow,
      '.react-tabs__tab-panel--selected .ace_content',
      'SELECT * FROM "document" LIMIT 101',
    );

    // Render results for a single query
    await mainWindow.waitForSelector('.grid-query-wrapper');
    const queryResults = await mainWindow.$$('.grid-query-wrapper');
    expect(queryResults).toHaveLength(1);

    // Assert rows
    const rows = await mainWindow.$$('.ReactVirtualized__Grid__cell');
    // NOTE: Keeping it disabled on CI for now. For some reason on running this
    // assertion on CI it doesn't return any rows.
    if (process.env.CI !== 'true') {
      expect(rows).toHaveLength(11); // rows + info header
      expect(await rows[0].innerText()).toBe('info');
      for (let i = 1; i < rows.length; i++) {
        expect(await rows[i].innerText()).toBe(`Ipsum ${i - 1}`);
      }
    }
  });
});
