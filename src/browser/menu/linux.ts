import { shell } from 'electron';
import { BrowserWindow, App, MenuItem, MenuItemConstructorOptions } from 'electron';

import * as eventKeys from '../../common/event';
import { Config } from '../../common/types/config';
import { BuildWindow } from '../../common/types/menu';
import { titlize } from '../../common/utils/string';

function sendMessage(win: BrowserWindow, message: string) {
  if (win) {
    win.webContents.send(message);
  }
}

export function buildTemplate(
  app: App,
  buildNewWindow: BuildWindow,
  appConfig: Config,
): Array<MenuItemConstructorOptions | MenuItem> {
  return [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'Ctrl+N',
          click: () => buildNewWindow(app),
        },
        {
          label: 'New Tab',
          accelerator: 'Ctrl+T',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_TAB_NEW),
        },
        {
          label: 'Close Tab',
          accelerator: 'Ctrl+W',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_TAB_CLOSE),
        },
        {
          type: 'separator',
        },
        {
          label: 'Save Query',
          accelerator: 'Ctrl+S',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_SAVE),
        },
        {
          label: 'Save Query As',
          accelerator: 'Shift+Ctrl+S',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_SAVE_AS),
        },
        {
          label: 'Open Query',
          accelerator: 'Ctrl+O',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_OPEN),
        },
        {
          type: 'separator',
        },
        {
          label: 'Quit',
          accelerator: 'Ctrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Query',
      submenu: [
        {
          label: 'Execute',
          accelerator: 'Ctrl+Enter',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_EXECUTE),
        },
        {
          label: 'Execute',
          accelerator: 'Ctrl+R',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_EXECUTE),
        },
        {
          label: 'Focus Query Editor',
          accelerator: 'Shift+Ctrl+0',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_FOCUS),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'Ctrl+Z',
          role: 'undo',
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Ctrl+Z',
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          label: 'Cut',
          accelerator: 'Ctrl+X',
          role: 'cut',
        },
        {
          label: 'Copy',
          accelerator: 'Ctrl+C',
          role: 'copy',
        },
        {
          label: 'Paste',
          accelerator: 'Ctrl+V',
          role: 'paste',
        },
        {
          label: 'Select All',
          accelerator: 'Ctrl+A',
          role: 'selectAll',
        },
        {
          type: 'separator',
        },
        {
          label: 'Beautify Query',
          accelerator: 'Ctrl+I',
          click: (_, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_EDITOR_FORMAT),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Ctrl+Shift+R',
          click: (item, win) => (win as BrowserWindow).webContents.reloadIgnoringCache(),
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'Alt+Ctrl+I',
          click: (item, win) => (win as BrowserWindow).webContents.toggleDevTools(),
        },
        {
          type: 'separator',
        },
        {
          label: 'Zoom In',
          accelerator: 'Ctrl+=',
          click: (item, win) => sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_ZOOM_IN),
        },
        {
          label: 'Zoom Out',
          accelerator: 'Ctrl+-',
          click: (item, win) => sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_ZOOM_OUT),
        },
        {
          label: 'Reset Zoom',
          accelerator: 'Ctrl+0',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_ZOOM_RESET),
        },
      ],
    },
    {
      label: 'Find',
      submenu: [
        {
          label: 'Search databases',
          accelerator: 'Shift+Ctrl+9',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_TOGGLE_DB_SEARCH),
        },
        {
          label: 'Search database objects',
          accelerator: 'Ctrl+9',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_TOGGLE_DB_OBJS_SEARCH),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Report Issue',
          click: () => shell.openExternal(appConfig.bugs as string),
        },
        {
          label: `About ${titlize(appConfig.name)}`,
          click: () => shell.openExternal(appConfig.homepage as string),
        },
      ],
    },
  ];
}
