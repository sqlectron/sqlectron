import { ipcMain, IpcMainInvokeEvent, IpcMainEvent } from 'electron';

import * as event from '../common/event';
import { DialogFilter, MenuOptions } from '../common/types/api';
import { Config } from '../common/types/config';
import { SchemaFilter, DatabaseFilter } from '../common/types/database';
import { Server } from '../common/types/server';

import browser from './browser';
import { getConfig } from './config';
import { config, servers, getConn } from './core';
import createLogger, { applyLogConfig } from './logger';

const rendererLogger = createLogger('renderer');

/**
 * All possible IPC handled by the main process is defined in this module
 */

function registerConfigIPCMainHandlers() {
  ipcMain.handle(event.CONFIG_PREPARE, (e: IpcMainInvokeEvent, cryptoSecret: string) =>
    config.prepare(cryptoSecret),
  );
  ipcMain.handle(event.CONFIG_PATH, () => config.path());
  ipcMain.handle(event.CONFIG_GET, () => config.get());
  ipcMain.handle(event.CONFIG_GET_FULL, (e: IpcMainInvokeEvent, forceCleanCache?: boolean) =>
    Promise.resolve(getConfig(forceCleanCache)),
  );
  ipcMain.on(event.CONFIG_GET_FULL_SYNC, (e: IpcMainEvent, forceCleanCache?: boolean) => {
    e.returnValue = getConfig(forceCleanCache);
  });
  ipcMain.handle(event.CONFIG_SAVE, (e: IpcMainInvokeEvent, data: Config) => config.save(data));
  ipcMain.handle(event.CONFIG_SAVE_SETTINS, async (e: IpcMainInvokeEvent, data: Config) => {
    await config.saveSettings(data);
    applyLogConfig(getConfig(true).log);
  });
}

function registerServersIPCMainHandlers() {
  ipcMain.handle(event.SERVERS_GET_ALL, () => servers.getAll());
  ipcMain.handle(event.SERVERS_ADD, (e: IpcMainInvokeEvent, server: Server, cryptoSecret: string) =>
    servers.add(server, cryptoSecret),
  );
  ipcMain.handle(
    event.SERVERS_UPDATE,
    (e: IpcMainInvokeEvent, server: Server, cryptoSecret: string) =>
      servers.update(server, cryptoSecret),
  );
  ipcMain.handle(
    event.SERVERS_ADD_OR_UPDATE,
    (e: IpcMainInvokeEvent, server: Server, cryptoSecret: string) =>
      servers.addOrUpdate(server, cryptoSecret),
  );
  ipcMain.handle(event.SERVERS_REMOVE_BY_ID, (e: IpcMainInvokeEvent, id: string) =>
    servers.removeById(id),
  );
  ipcMain.handle(
    event.SERVERS_DECRYPT_SECRETS,
    (e: IpcMainInvokeEvent, server: Server, cryptoSecret: string) =>
      servers.decryptSecrects(server, cryptoSecret),
  );
}

function registerLoggerIPCMainHandlers() {
  ipcMain.on(event.LOGGER_ERROR, (e: IpcMainEvent, ...args: any[]) => {
    rendererLogger.error(...args);
  });
}

function registerDBIPCMainHandlers() {
  ipcMain.on(event.DB_GET_CLIENTS_SYNC, (e: IpcMainEvent) => {
    e.returnValue = getConn(e).getClientsSync();
  });
  ipcMain.handle(event.DB_CONNECT, (e: IpcMainInvokeEvent, server: Server, database?: string) =>
    getConn(e).connect(server, database),
  );
  ipcMain.handle(event.DB_DISCONNECT_DATABASE, (e: IpcMainInvokeEvent, database?: string) =>
    getConn(e).disconnectDatabse(database),
  );
  ipcMain.handle(event.DB_DISCONNECT_SERVER, (e: IpcMainInvokeEvent) =>
    getConn(e).disconnectServer(),
  );
  ipcMain.handle(
    event.DB_LIST_DATABASES,
    (e: IpcMainInvokeEvent, database: string, filter: DatabaseFilter) =>
      getConn(e).listDatabases(database, filter),
  );
  ipcMain.handle(
    event.DB_LIST_SCHEMAS,
    (e: IpcMainInvokeEvent, database: string, filter: SchemaFilter) =>
      getConn(e).listSchemas(database, filter),
  );
  ipcMain.handle(
    event.DB_LIST_TABLES,
    (e: IpcMainInvokeEvent, database: string, filter: SchemaFilter) => {
      return getConn(e).listTables(database, filter);
    },
  );
  ipcMain.handle(
    event.DB_LIST_VIEWS,
    (e: IpcMainInvokeEvent, database: string, filter: SchemaFilter) =>
      getConn(e).listViews(database, filter),
  );
  ipcMain.handle(
    event.DB_LIST_ROUTINES,
    (e: IpcMainInvokeEvent, database: string, filter: SchemaFilter) =>
      getConn(e).listRoutines(database, filter),
  );
  ipcMain.handle(
    event.DB_LIST_TABLE_COLUMNS,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).listTableColumns(database, table, schema),
  );
  ipcMain.handle(
    event.DB_LIST_TABLE_TRIGGERS,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).listTableTriggers(database, table, schema),
  );
  ipcMain.handle(
    event.DB_LIST_TABLE_INDEXES,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).listTableIndexes(database, table, schema),
  );
  ipcMain.handle(
    event.DB_GET_TABLE_REFERENCES,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).getTableReferences(database, table, schema),
  );
  ipcMain.handle(
    event.DB_GET_TABLE_KEYS,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).getTableKeys(database, table, schema),
  );
  ipcMain.handle(
    event.DB_CREATE_CANCELLABLE_QUERY,
    (e: IpcMainInvokeEvent, database: string, queryId: number, queryText: string) =>
      getConn(e).createCancellableQuery(database, queryId, queryText),
  );
  ipcMain.handle(event.DB_CANCEL_CANCELLABLE_QUERY, (e: IpcMainInvokeEvent, queryId: number) =>
    getConn(e).cancelCancellableQuery(queryId),
  );
  ipcMain.handle(event.DB_EXECUTE_CANCELLABLE_QUERY, (e: IpcMainInvokeEvent, queryId: number) =>
    getConn(e).executeCancellableQuery(queryId),
  );
  ipcMain.handle(
    event.DB_EXECUTE_QUERY,
    (e: IpcMainInvokeEvent, database: string, queryText: string) =>
      getConn(e).executeQuery(database, queryText),
  );
  ipcMain.handle(
    event.DB_GET_QUERY_SELECT_TOP,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).getQuerySelectTop(database, table, schema),
  );
  ipcMain.handle(
    event.DB_GET_TABLE_CREATE_SCRIPT,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).getTableCreateScript(database, table, schema),
  );
  ipcMain.handle(
    event.DB_GET_TABLE_SELECT_SCRIPT,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).getTableSelectScript(database, table, schema),
  );
  ipcMain.handle(
    event.DB_GET_TABLE_INSERT_SCRIPT,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).getTableInsertScript(database, table, schema),
  );
  ipcMain.handle(
    event.DB_GET_TABLE_UPDATE_SCRIPT,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).getTableUpdateScript(database, table, schema),
  );
  ipcMain.handle(
    event.DB_GET_TABLE_DELETE_SCRIPT,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).getTableDeleteScript(database, table, schema),
  );
  ipcMain.handle(
    event.DB_GET_VIEW_CREATE_SCRIPT,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).getViewCreateScript(database, table, schema),
  );
  ipcMain.handle(
    event.DB_GET_ROUTINE_CREATE_SCRIPT,
    (e: IpcMainInvokeEvent, database: string, table: string, type: string, schema?: string) =>
      getConn(e).getRoutineCreateScript(database, table, type, schema),
  );
  ipcMain.handle(
    event.DB_TRUNCATE_ALL_TABLES,
    (e: IpcMainInvokeEvent, database: string, schema?: string) =>
      getConn(e).truncateAllTables(database, schema),
  );
  ipcMain.handle(
    event.DB_GET_TABLE_COLUMN_NAMES,
    (e: IpcMainInvokeEvent, database: string, table: string, schema?: string) =>
      getConn(e).getTableColumnNames(database, table, schema),
  );
  ipcMain.handle(event.DB_SET_SELECT_LIMIT, (e: IpcMainInvokeEvent, limit: number) =>
    getConn(e).setSelectLimit(limit),
  );
  ipcMain.handle(
    event.DB_EXPORT_QUERY_RESULT_TO_FILE,
    (e: IpcMainInvokeEvent, rows: any[], exportType: string, delimiter?: string) =>
      getConn(e).exportQueryResultToFile(rows, exportType, delimiter),
  );
  ipcMain.handle(
    event.DB_EXPORT_QUERY_RESULT_TO_CLIPBOARD,
    (e: IpcMainInvokeEvent, rows: any[], exportType: string, delimiter?: string) =>
      getConn(e).exportQueryResultToClipboard(rows, exportType, delimiter),
  );

  ipcMain.handle(
    event.DB_QUERY_SAVE,
    (e: IpcMainInvokeEvent, isSaveAs: boolean, filename: string, query: string) =>
      getConn(e).saveQuery(isSaveAs, filename, query),
  );
  ipcMain.handle(event.DB_QUERY_OPEN, (e: IpcMainInvokeEvent) => getConn(e).openQuery());
}

function registerBrowserIPCMainHandlers() {
  // Dialog events
  ipcMain.handle(
    event.BROWSER_DIALOG_SHOW_SAVE_DIALOG,
    (e: IpcMainInvokeEvent, filters: Array<DialogFilter>) => browser.dialog.showSaveDialog(filters),
  );
  ipcMain.handle(
    event.BROWSER_DIALOG_SHOW_OPEN_DIALOG,
    (e: IpcMainInvokeEvent, filters: Array<DialogFilter>, defaultPath: string) =>
      browser.dialog.showOpenDialog(filters, defaultPath),
  );

  // FS events
  ipcMain.handle(
    event.BROWSER_FS_SAVE_FILE,
    (e: IpcMainInvokeEvent, filename: string, data: unknown, encoding?: string) =>
      browser.fs.saveFile(filename, data, encoding),
  );
  ipcMain.handle(event.BROWSER_FS_OPEN_FILE, (e: IpcMainInvokeEvent, filename: string) =>
    browser.fs.openFile(filename),
  );

  // Menug events
  ipcMain.handle(
    event.BROWSER_MENU_CTX_MENU_BUILD,
    (e: IpcMainInvokeEvent, menuId: string, options: MenuOptions) =>
      browser.menu.buildContextMenu(menuId, options, e),
  );
  ipcMain.handle(
    event.BROWSER_MENU_CTX_MENU_POPUP,
    (e: IpcMainInvokeEvent, menuId: string, position: { x: number; y: number }) =>
      browser.menu.popupContextMenu(menuId, position, e),
  );

  // Shell events
  ipcMain.handle(event.BROWSER_SHELL_OPEN, (_, url: string) => browser.shell.openExternal(url));

  // Clipboard events
  ipcMain.on(event.BROWSER_CLIPBOARD_WRITE, (_, text: string) => browser.clipboard.writeText(text));

  // WebFrame events
  ipcMain.on(event.BROWSER_WEB_FRAME_SET_ZOOM_FACTOR, (e: IpcMainEvent, zoom: number) =>
    browser.webFrame.setZoomFactor(zoom, e),
  );
}

export const registerIPCMainHandlers = (): void => {
  registerConfigIPCMainHandlers();
  registerServersIPCMainHandlers();
  registerLoggerIPCMainHandlers();
  registerDBIPCMainHandlers();
  registerBrowserIPCMainHandlers();
};
