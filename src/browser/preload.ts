/**
 * Expose remote modules to the renderer process.
 */
import { ipcRenderer, contextBridge } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import type { SqlectronAPI, DialogFilter, MenuOptions, ListenerUnsub } from '../common/types/api';
import type { DatabaseFilter, SchemaFilter } from '../common/types/database';
import type { Server } from '../common/types/server';
import type { Config } from '../common/types/config';
import * as eventKeys from '../common/event';

const ipcRendererHelper = {
  receive: (channel: string, cb: (...args: Array<string>) => void): ListenerUnsub => {
    // Deliberately strip event as it includes `sender`
    const subscription = (event, ...args) => cb(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};

const sqlectronAPI: SqlectronAPI = {
  db: {
    getClientsSync: () => ipcRenderer.sendSync(eventKeys.DB_GET_CLIENTS_SYNC),
    connect: (server: Server, database?: string) =>
      ipcRenderer.invoke(eventKeys.DB_CONNECT, server, database),
    disconnectDatabse: (database?: string) =>
      ipcRenderer.invoke(eventKeys.DB_DISCONNECT_DATABASE, database),
    disconnectServer: () => ipcRenderer.invoke(eventKeys.DB_DISCONNECT_SERVER),
    listDatabases: (database: string, filter?: DatabaseFilter) =>
      ipcRenderer.invoke(eventKeys.DB_LIST_DATABASES, database, filter),
    listSchemas: (database: string, filter: SchemaFilter) =>
      ipcRenderer.invoke(eventKeys.DB_LIST_SCHEMAS, database, filter),
    listTables: (database: string, filter: SchemaFilter) =>
      ipcRenderer.invoke(eventKeys.DB_LIST_TABLES, database, filter),
    listViews: (database: string, filter: SchemaFilter) =>
      ipcRenderer.invoke(eventKeys.DB_LIST_VIEWS, database, filter),
    listRoutines: (database: string, filter: SchemaFilter) =>
      ipcRenderer.invoke(eventKeys.DB_LIST_ROUTINES, database, filter),
    listTableColumns: (database: string, table: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_LIST_TABLE_COLUMNS, database, table, schema),
    listTableTriggers: (database: string, table: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_LIST_TABLE_TRIGGERS, database, table, schema),
    listTableIndexes: (database: string, table: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_LIST_TABLE_INDEXES, database, table, schema),
    getTableReferences: (database: string, table: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_GET_TABLE_REFERENCES, database, table, schema),
    getTableKeys: (database: string, table: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_GET_TABLE_KEYS, database, table, schema),
    createCancellableQuery: async (database: string, queryId: number, queryText: string) =>
      ipcRenderer.invoke(eventKeys.DB_CREATE_CANCELLABLE_QUERY, database, queryId, queryText),
    cancelCancellableQuery: async (queryId: number) =>
      ipcRenderer.invoke(eventKeys.DB_CANCEL_CANCELLABLE_QUERY, queryId),
    executeCancellableQuery: (queryId: number) =>
      ipcRenderer.invoke(eventKeys.DB_EXECUTE_CANCELLABLE_QUERY, queryId),
    executeQuery: (database: string, queryText: string) =>
      ipcRenderer.invoke(eventKeys.DB_EXECUTE_QUERY, database, queryText),
    getQuerySelectTop: (database: string, table: string, schema?: string, limit?: number) =>
      ipcRenderer.invoke(eventKeys.DB_GET_QUERY_SELECT_TOP, database, table, schema, limit),
    getTableCreateScript: (database: string, table: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_GET_TABLE_CREATE_SCRIPT, database, table, schema),
    getTableSelectScript: (database: string, table: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_GET_TABLE_SELECT_SCRIPT, database, table, schema),
    getTableInsertScript: (database: string, table: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_GET_TABLE_INSERT_SCRIPT, database, table, schema),
    getTableUpdateScript: (database: string, table: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_GET_TABLE_UPDATE_SCRIPT, database, table, schema),
    getTableDeleteScript: (database: string, table: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_GET_TABLE_DELETE_SCRIPT, database, table, schema),
    getViewCreateScript: (database: string, view: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_GET_VIEW_CREATE_SCRIPT, database, view, schema),
    getRoutineCreateScript: (database: string, routine: string, type: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_GET_ROUTINE_CREATE_SCRIPT, database, routine, type, schema),
    truncateAllTables: (database: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_TRUNCATE_ALL_TABLES, database, schema),
    getTableColumnNames: (database: string, table: string, schema?: string) =>
      ipcRenderer.invoke(eventKeys.DB_GET_TABLE_COLUMN_NAMES, database, table, schema),
    setSelectLimit: (limit: number) => ipcRenderer.invoke(eventKeys.DB_SET_SELECT_LIMIT, limit),
    exportQueryResultToFile: (rows: any[], exportType: string, delimiter?: string) =>
      ipcRenderer.invoke(eventKeys.DB_EXPORT_QUERY_RESULT_TO_FILE, rows, exportType, delimiter),
    exportQueryResultToClipboard: (rows: any[], exportType: string, delimiter?: string) =>
      ipcRenderer.invoke(
        eventKeys.DB_EXPORT_QUERY_RESULT_TO_CLIPBOARD,
        rows,
        exportType,
        delimiter,
      ),

    saveQuery: (isSaveAs: boolean, filename: string | null, query: string) =>
      ipcRenderer.invoke(eventKeys.DB_QUERY_SAVE, isSaveAs, filename, query),
    openQuery: () => ipcRenderer.invoke(eventKeys.DB_QUERY_OPEN),
  },
  servers: {
    getAll: () => ipcRenderer.invoke(eventKeys.SERVERS_GET_ALL),
    add: (server: Server, cryptoSecret: string) =>
      ipcRenderer.invoke(eventKeys.SERVERS_ADD, server, cryptoSecret),
    update: (server: Server, cryptoSecret: string) =>
      ipcRenderer.invoke(eventKeys.SERVERS_UPDATE, server, cryptoSecret),
    addOrUpdate: (server: Server, cryptoSecret: string) =>
      ipcRenderer.invoke(eventKeys.SERVERS_ADD_OR_UPDATE, server, cryptoSecret),
    removeById: (id: string) => ipcRenderer.invoke(eventKeys.SERVERS_REMOVE_BY_ID, id),
    decryptSecrects: (server: Server, cryptoSecret: string) =>
      ipcRenderer.invoke(eventKeys.SERVERS_DECRYPT_SECRETS, server, cryptoSecret),
  },
  config: {
    prepare: (cryptoSecret: string) => ipcRenderer.invoke(eventKeys.CONFIG_PREPARE, cryptoSecret),
    path: () => ipcRenderer.invoke(eventKeys.CONFIG_PATH),
    get: () => ipcRenderer.invoke(eventKeys.CONFIG_GET),
    getFull: (forceCleanCache?: boolean) =>
      ipcRenderer.invoke(eventKeys.CONFIG_GET_FULL, forceCleanCache),
    getFullSync: () => ipcRenderer.sendSync(eventKeys.CONFIG_GET_FULL_SYNC),
    save: (data: Config) => ipcRenderer.invoke(eventKeys.CONFIG_SAVE, data),
    saveSettings: (data: Config) => ipcRenderer.invoke(eventKeys.CONFIG_SAVE_SETTINS, data),
  },
  logger: {
    error: (...args) => ipcRenderer.send(eventKeys.LOGGER_ERROR, ...args),
  },
  browser: {
    dialog: {
      showSaveDialog: (filters: Array<DialogFilter>) =>
        ipcRenderer.invoke(eventKeys.BROWSER_DIALOG_SHOW_SAVE_DIALOG, filters),
      showOpenDialog: (filters: Array<DialogFilter>, defaultPath?: string) =>
        ipcRenderer.invoke(eventKeys.BROWSER_DIALOG_SHOW_OPEN_DIALOG, filters, defaultPath),
    },

    fs: {
      saveFile: (filename: string, data: unknown, encoding?: string) =>
        ipcRenderer.invoke(eventKeys.BROWSER_FS_SAVE_FILE, filename, data, encoding),
      openFile: (filename: string) => ipcRenderer.invoke(eventKeys.BROWSER_FS_OPEN_FILE, filename),
    },

    menu: {
      buildContextMenu: (menuId: string, options: MenuOptions, e?: IpcMainInvokeEvent) =>
        ipcRenderer.invoke(eventKeys.BROWSER_MENU_CTX_MENU_BUILD, menuId, options, e),
      popupContextMenu: (
        menuId: string,
        position: { x: number; y: number },
        e?: IpcMainInvokeEvent,
      ) => ipcRenderer.invoke(eventKeys.BROWSER_MENU_CTX_MENU_POPUP, menuId, position, e),

      onMenuClick: (menuEvent: string, cb: () => void): ListenerUnsub => {
        if (!menuEvent.startsWith('BROWSER_MENU_')) {
          throw new Error('Invalid menu event');
        }

        return ipcRendererHelper.receive(menuEvent, cb);
      },
    },

    shell: {
      openExternal: (url: string) => ipcRenderer.invoke(eventKeys.BROWSER_SHELL_OPEN, url),
    },

    clipboard: {
      writeText: (text: string) => ipcRenderer.send(eventKeys.BROWSER_CLIPBOARD_WRITE, text),
    },

    webFrame: {
      setZoomFactor: (zoom: number) =>
        ipcRenderer.send(eventKeys.BROWSER_WEB_FRAME_SET_ZOOM_FACTOR, zoom),
    },
  },

  update: {
    checkUpdateAvailable: () => ipcRenderer.send(eventKeys.UPDATE_CHECK),
    onUpdateAvailable: (
      cb: (currentVersion: string, latestVersion: string) => void,
    ): ListenerUnsub => ipcRendererHelper.receive(eventKeys.UPDATE_AVAILABLE, cb),
  },
};

// Adds an object 'sqlectron' to the global window object:
// which has all communication with the backend (browser)
contextBridge.exposeInMainWorld('sqlectron', sqlectronAPI);
