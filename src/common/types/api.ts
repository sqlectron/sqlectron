import type { IpcMainInvokeEvent, IpcMainEvent } from 'electron';
import type { QueryRowResult, SchemaFilter, DatabaseFilter } from 'sqlectron-db-core';

import type { BaseConfig, Config } from './config';
import type { Adapter, DbTable, DbView } from './database';
import type { Server, ServerResult } from './server';

export interface MenuOptions {
  menuItems: Array<MenuItem>;
}

export interface MenuItem {
  type?: string;
  label?: string;
  event?: string;
}

export interface SqlectronConfig {
  prepare(cryptoSecret: string): Promise<void>;
  path(): Promise<string>;
  get(): Promise<Config>;
  getFull(forceCleanCache?: boolean): Promise<Config>;
  getFullSync(forceCleanCache?: boolean): Config;
  save(data: Config): Promise<void>;
  saveSettings(data: BaseConfig): Promise<void>;
}

export interface SqlectronLogger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (...args: any[]) => void;
}

export interface SqlectronDB {
  getClientsSync(): Array<Adapter>;
  connect(server?: Server, database?: string): Promise<void>;
  disconnectDatabse(database?: string): Promise<void>;
  disconnectServer(database?: string): Promise<void>;
  listDatabases(database: string, filter?: DatabaseFilter): Promise<string[]>;
  listSchemas(database: string, filter?: SchemaFilter): Promise<string[]>;
  listTables(database: string, filter?: SchemaFilter): Promise<DbTable[]>;
  listViews(database: string, filter?: SchemaFilter): Promise<DbView[]>;
  listRoutines(
    database: string,
    filter?: SchemaFilter,
  ): Promise<
    {
      schema?: string;
      routineName: string;
      routineType: string;
    }[]
  >;
  listTableColumns(
    database: string,
    table: string,
    schema?: string,
  ): Promise<
    {
      columnName: string;
      dataType: string;
    }[]
  >;
  listTableTriggers(database: string, table: string, schema?: string): Promise<string[]>;
  listTableIndexes(database: string, table: string, schema?: string): Promise<string[]>;
  getTableReferences(database: string, table: string, schema?: string): Promise<string[]>;
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
  >;
  createCancellableQuery(database: string, queryId: number, queryText: string): Promise<void>;
  cancelCancellableQuery(queryId: number): Promise<void>;
  executeCancellableQuery(queryId: number): Promise<QueryRowResult[]>;
  executeQuery(database: string, queryText: string): Promise<QueryRowResult[]>;
  getQuerySelectTop(
    database: string,
    table: string,
    schema?: string,
    limit?: number,
  ): Promise<string>;
  getTableCreateScript(database: string, table: string, schema?: string): Promise<string[]>;
  getTableSelectScript(database: string, table: string, schema?: string): Promise<string>;
  getTableInsertScript(database: string, table: string, schema?: string): Promise<string>;
  getTableUpdateScript(database: string, table: string, schema?: string): Promise<string>;
  getTableDeleteScript(database: string, table: string, schema?: string): Promise<string>;
  getViewCreateScript(database: string, view: string, schema?: string): Promise<string[]>;
  getRoutineCreateScript(
    database: string,
    routine: string,
    type: string,
    schema?: string,
  ): Promise<string[]>;
  truncateAllTables(database: string, schema?: string): Promise<void>;
  getTableColumnNames(database: string, table: string, schema?: string): Promise<string[]>;
  setSelectLimit(limit: number): void;

  exportQueryResultToFile(rows: any[], exportType: string, delimiter?: string): Promise<void>;
  exportQueryResultToClipboard(rows: any[], exportType: string, delimiter?: string): Promise<void>;

  saveQuery(
    isSaveAs: boolean,
    filename: string | null,
    query: string,
  ): Promise<{ name: string; filename: string }>;
  openQuery(): Promise<{ name: string; query: string; filename: string }>;
}

export interface SqlectronServers {
  getAll(): Promise<Array<Server>>;
  add(server: Server, cryptoSecret: string): Promise<ServerResult>;
  update(server: Server, cryptoSecret: string): Promise<ServerResult>;
  addOrUpdate(server: Server, cryptoSecret: string): Promise<ServerResult>;
  removeById(id: string): Promise<void>;
  decryptSecrects(server: Server, cryptoSecret: string): Promise<Server>;
}

export interface DialogFilter {
  name: string;
  extensions: Array<string>;
}

export interface SqlectronBrowserDialog {
  showSaveDialog(filters: Array<DialogFilter>): Promise<string>;
  showOpenDialog(filters: Array<DialogFilter>, defaultPath?: string): Promise<string[]>;
}

export interface SqlectronBrowserFS {
  saveFile(filename: string, data: unknown, encoding?: string): Promise<void>;
  openFile(filename: string): Promise<string>;
}

export interface SqlectronBrowserMenu {
  buildContextMenu(menuId: string, options: MenuOptions, event?: IpcMainInvokeEvent): void;
  popupContextMenu(
    menuId: string,
    position: { x: number; y: number },
    event?: IpcMainInvokeEvent,
  ): void;

  onMenuClick(menuEvent: string, cb: () => void): ListenerUnsub;
}

export interface SqlectronBrowserShell {
  openExternal(url: string): Promise<void>;
}

export interface SqlectronBrowserClipboard {
  writeText(text: string): void;
}

export interface SqlectronBrowserWebFrame {
  setZoomFactor(zoom: number, event?: IpcMainEvent): void;
}

export interface SqlectronUpdate {
  checkUpdateAvailable(): void;
  onUpdateAvailable(cb: (currentVersion: string, latestVersion: string) => void): ListenerUnsub;
}

export interface SqlectronBrowser {
  dialog: SqlectronBrowserDialog;
  fs: SqlectronBrowserFS;
  menu: SqlectronBrowserMenu;
  shell: SqlectronBrowserShell;
  clipboard: SqlectronBrowserClipboard;
  webFrame: SqlectronBrowserWebFrame;
}

export type ListenerUnsub = () => void;

export interface SqlectronBrowser {
  dialog: SqlectronBrowserDialog;
  fs: SqlectronBrowserFS;
  menu: SqlectronBrowserMenu;
}

export interface SqlectronAPI {
  db: SqlectronDB;
  servers: SqlectronServers;
  config: SqlectronConfig;
  logger: SqlectronLogger;
  browser: SqlectronBrowser;
  update: SqlectronUpdate;
}
