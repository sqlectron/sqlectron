import csvStringify from 'csv-stringify';
import { WebContents, BrowserWindow, IpcMainInvokeEvent, IpcMainEvent } from 'electron';
import { cloneDeep, omit } from 'lodash';
import path from 'path';
import * as db from 'sqlectron-db-core';
import { ADAPTERS, setSelectLimit } from 'sqlectron-db-core';
import type {
  Database,
  QueryRowResult,
  DatabaseFilter,
  SchemaFilter,
  Server as DBServer,
  LegacyServerConfig,
} from 'sqlectron-db-core';

import type { SqlectronDB } from '../../common/types/api';
import type { Adapter, DbTable, DbView } from '../../common/types/database';
import { Server } from '../../common/types/server';
import { rowsValuesToString } from '../../common/utils/convert';
import browserFacade from '../browser';

import { writeFile, readFile } from './utils';

interface CancellableQuery {
  execute: () => Promise<QueryRowResult[]>;
  cancel: () => void;
}

// DatabaseFacade is a wrapper over the Database instance keeping all DB calls
// in the browser process
export default class DatabaseFacade implements SqlectronDB {
  private serverSession: DBServer | null;

  private cancellableQueries: {
    [queryId: string]: CancellableQuery;
  } = {};

  constructor() {
    this.serverSession = null;
  }

  private getDB(database: string): Database {
    // NOTE: No database will get a server connection using an unknown database
    const dbConn = this.serverSession?.db(database as string);
    if (!dbConn) {
      throw new Error(`No database found ${database}`);
    }

    return dbConn;
  }

  getClientsSync(): Array<Adapter> {
    // Omit non-serializable objects because IPC calls cannot serialize them
    return ADAPTERS.map((c) => omit(c, 'adapter'));
  }

  async connect(server: Server, database?: string): Promise<void> {
    const legacyServer = server as LegacyServerConfig;

    if (!this.serverSession) {
      this.serverSession = db.createServer(legacyServer);
    }

    let dbConn = this.serverSession.db(database as string);
    if (!dbConn) {
      dbConn = this.serverSession.createConnection(database);
    }

    if (!dbConn) {
      throw new Error('Could not connect to database');
    }

    try {
      await dbConn?.connect();
    } catch (err) {
      dbConn.disconnect();

      if (this.serverSession && Object.keys(this.serverSession.databases).length === 0) {
        this.serverSession.end();
        this.serverSession = null;
      }

      throw err;
    }
  }

  disconnectDatabse(database?: string): Promise<void> {
    return Promise.resolve(this.getDB(database as string).disconnect());
  }

  disconnectServer(): Promise<void> {
    if (this.serverSession) {
      this.serverSession.end();
    }
    this.serverSession = null;
    return Promise.resolve();
  }

  listDatabases(database: string, filter: DatabaseFilter): Promise<string[]> {
    return this.getDB(database).listDatabases(filter);
  }

  listSchemas(database: string, filter: SchemaFilter): Promise<string[]> {
    return this.getDB(database).listSchemas(filter);
  }

  listTables(database: string, filter: SchemaFilter): Promise<DbTable[]> {
    return this.getDB(database).listTables(filter);
  }

  listViews(database: string, filter: SchemaFilter): Promise<DbView[]> {
    return this.getDB(database).listViews(filter);
  }

  listRoutines(
    database: string,
    filter: SchemaFilter,
  ): Promise<
    {
      schema?: string;
      routineName: string;
      routineType: string;
    }[]
  > {
    return this.getDB(database).listRoutines(filter);
  }

  listTableColumns(
    database: string,
    table: string,
    schema?: string,
  ): Promise<
    {
      columnName: string;
      dataType: string;
    }[]
  > {
    return this.getDB(database).listTableColumns(table, schema);
  }

  listTableTriggers(database: string, table: string, schema?: string): Promise<string[]> {
    return this.getDB(database).listTableTriggers(table, schema);
  }

  listTableIndexes(database: string, table: string, schema?: string): Promise<string[]> {
    return this.getDB(database).listTableIndexes(table, schema);
  }

  getTableReferences(database: string, table: string, schema?: string): Promise<string[]> {
    return this.getDB(database).getTableReferences(table, schema);
  }

  getTableKeys(
    database: string,
    table: string,
    schema?: string,
  ): Promise<
    {
      columnName: string;
      keyType: string;
      constraintName: string | null;
      referencedTable: string | null;
    }[]
  > {
    return this.getDB(database).getTableKeys(table, schema);
  }

  createCancellableQuery(database: string, queryId: number, queryText: string): Promise<void> {
    this.cancellableQueries[queryId] = this.getDB(database).query(queryText);
    return Promise.resolve();
  }

  async cancelCancellableQuery(queryId: number): Promise<void> {
    const query = this.cancellableQueries[queryId];
    try {
      if (query) {
        await query.cancel();
      }
    } finally {
      delete this.cancellableQueries[queryId];
    }
  }

  async executeCancellableQuery(queryId: number): Promise<QueryRowResult[]> {
    try {
      const query = this.cancellableQueries[queryId];
      if (query) {
        const results = await query.execute();
        return results;
      }

      return [];
    } finally {
      delete this.cancellableQueries[queryId];
    }
  }

  executeQuery(database: string, queryText: string): Promise<QueryRowResult[]> {
    return this.getDB(database).executeQuery(queryText);
  }

  getQuerySelectTop(database: string, table: string, schema?: string): Promise<string> {
    return this.getDB(database).getQuerySelectTop(table, schema);
  }

  getTableCreateScript(database: string, table: string, schema?: string): Promise<string[]> {
    return this.getDB(database).getTableCreateScript(table, schema);
  }

  getTableSelectScript(database: string, table: string, schema?: string): Promise<string> {
    return this.getDB(database).getTableSelectScript(table, schema);
  }

  getTableInsertScript(database: string, table: string, schema?: string): Promise<string> {
    return this.getDB(database).getTableInsertScript(table, schema);
  }

  getTableUpdateScript(database: string, table: string, schema?: string): Promise<string> {
    return this.getDB(database).getTableUpdateScript(table, schema);
  }

  getTableDeleteScript(database: string, table: string, schema?: string): Promise<string> {
    return this.getDB(database).getTableDeleteScript(table, schema);
  }

  getViewCreateScript(database: string, table: string, schema?: string): Promise<string[]> {
    return this.getDB(database).getViewCreateScript(table, schema);
  }

  getRoutineCreateScript(
    database: string,
    table: string,
    type: string,
    schema?: string,
  ): Promise<string[]> {
    return this.getDB(database).getRoutineCreateScript(table, type, schema);
  }

  truncateAllTables(database: string, schema?: string): Promise<void> {
    return this.getDB(database).truncateAllTables(schema);
  }

  getTableColumnNames(database: string, table: string, schema?: string): Promise<string[]> {
    return this.getDB(database).getTableColumnNames(table, schema);
  }

  setSelectLimit(limit: number): void {
    return setSelectLimit(limit);
  }

  async exportQueryResultToFile(
    rows: any[],
    exportType: string,
    delimiter?: string,
  ): Promise<void> {
    let value;
    const filters = [{ name: 'All Files', extensions: ['*'] }];

    if (exportType === 'CSV') {
      value = await stringifyResultToCSV(rows, delimiter || ',');
      filters.push({ name: 'CSV', extensions: ['csv'] });
    } else {
      value = JSON.stringify(rows, null, 2);
      filters.push({ name: 'JSON', extensions: ['json'] });
    }

    let filename = await browserFacade.dialog.showSaveDialog(filters);
    if (path.extname(filename) !== `.${exportType.toLowerCase()}`) {
      filename += `.${exportType.toLowerCase()}`;
    }

    await writeFile(filename, value);
  }

  async exportQueryResultToClipboard(
    rows: any[],
    exportType: string,
    delimiter?: string,
  ): Promise<void> {
    let value;

    if (exportType === 'CSV') {
      value = await stringifyResultToCSV(rows, delimiter || ',');
    } else {
      value = JSON.stringify(rows, null, 2);
    }

    browserFacade.clipboard.writeText(value);
  }

  async saveQuery(
    isSaveAs: boolean,
    filename: string,
    query: string,
  ): Promise<{ name: string; filename: string }> {
    const filters = [
      { name: 'SQL', extensions: ['sql'] },
      { name: 'All Files', extensions: ['*'] },
    ];

    if (isSaveAs || !filename) {
      filename = await browserFacade.dialog.showSaveDialog(filters);
    }

    if (path.extname(filename) !== '.sql') {
      filename += '.sql';
    }

    await writeFile(filename, query);
    const name = path.basename(filename, '.sql');

    return { name, filename };
  }

  async openQuery(): Promise<{ name: string; query: string; filename: string }> {
    const filters = [{ name: 'SQL', extensions: ['sql'] }];

    const [filename] = await browserFacade.dialog.showOpenDialog(filters);
    const name = path.basename(filename, '.sql');

    const query = await readFile(filename);

    return { name, query, filename };
  }
}

// Keep connections by BrowserWindow instances
const connections: {
  [windowId: string]: SqlectronDB;
} = {};

// Get connection based on the event source (BrowserWindow instance)
export const getConn = (e: IpcMainEvent | IpcMainInvokeEvent): SqlectronDB => {
  const sourceWindow = BrowserWindow.fromWebContents(e.sender as WebContents);
  if (!sourceWindow) {
    throw new Error('Could not resolve current window');
  }

  const windowId = sourceWindow.id;

  let conn = connections[windowId];
  if (!conn) {
    conn = new DatabaseFacade();
    connections[windowId] = conn;
  }

  return conn;
};

function stringifyResultToCSV(origRows: any[], delimiter: string): Promise<string> {
  if (!origRows.length) {
    return Promise.resolve('');
  }

  const rows = cloneDeep(origRows);

  const header = Object.keys(rows[0]).reduce((_header, col) => {
    _header[col] = col;
    return _header;
  }, {});

  const data = [header, ...rowsValuesToString(rows)];

  return new Promise((resolve, reject) => {
    csvStringify(data, { delimiter }, (err, csv) => {
      if (err) {
        reject(err);
      } else {
        resolve(csv as string);
      }
    });
  });
}
