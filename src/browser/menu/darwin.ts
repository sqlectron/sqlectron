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
      label: appConfig.name,
      submenu: [
        {
          label: `About ${titlize(appConfig.name)}`,
          // TODO: selector property isn't a field in the menu constructor.
          // It is specific for macOS https://github.com/electron/electron/issues/2268
          // Find out if it still works and check if there is another way to achieve this
          // without having to ignore this typescript error.
          // @ts-ignore
          selector: 'orderFrontStandardAboutPanel:',
        },
        {
          type: 'separator',
        },
        {
          label: 'Services',
          submenu: [],
        },
        {
          type: 'separator',
        },
        {
          label: `Hide ${titlize(appConfig.name)}`,
          accelerator: 'Cmd+H',
          role: 'hide',
        },
        {
          label: 'Hide Others',
          accelerator: 'Cmd+Shift+H',
          // @ts-ignore
          selector: 'hideOtherApplications:',
        },
        {
          label: 'Show All',
          // @ts-ignore
          selector: 'unhideAllApplications:',
        },
        {
          type: 'separator',
        },
        {
          label: 'Quit',
          accelerator: 'Cmd+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'Cmd+N',
          click: () => buildNewWindow(app),
        },
        {
          label: 'New Tab',
          accelerator: 'Cmd+T',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_TAB_NEW),
        },
        {
          label: 'Close Tab',
          accelerator: 'Cmd+W',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_TAB_CLOSE),
        },
        {
          type: 'separator',
        },
        {
          label: 'Save Query',
          accelerator: 'Cmd+S',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_SAVE),
        },
        {
          label: 'Save Query As',
          accelerator: 'Shift+Cmd+S',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_SAVE_AS),
        },
        {
          label: 'Open Query',
          accelerator: 'Cmd+O',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_OPEN),
        },
      ],
    },
    {
      label: 'Query',
      submenu: [
        {
          label: 'Execute',
          accelerator: 'Cmd+Enter',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_EXECUTE),
        },
        {
          label: 'Execute',
          accelerator: 'Cmd+R',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_QUERY_EXECUTE),
        },
        {
          label: 'Focus Query Editor',
          accelerator: 'Shift+Cmd+0',
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
          accelerator: 'Cmd+Z',
          role: 'undo',
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Cmd+Z',
          role: 'redo',
        },
        {
          type: 'separator',
        },
        {
          label: 'Cut',
          accelerator: 'Cmd+X',
          role: 'cut',
        },
        {
          label: 'Copy',
          accelerator: 'Cmd+C',
          role: 'copy',
        },
        {
          label: 'Paste',
          accelerator: 'Cmd+V',
          role: 'paste',
        },
        {
          label: 'Select All',
          accelerator: 'Cmd+A',
          role: 'selectAll',
        },
        {
          type: 'separator',
        },
        {
          label: 'Beautify Query',
          accelerator: 'Cmd+I',
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
          accelerator: 'Cmd+Shift+R',
          click: (item, win) => (win as BrowserWindow).webContents.reloadIgnoringCache(),
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'Alt+Cmd+I',
          click: (item, win) => (win as BrowserWindow).webContents.toggleDevTools(),
        },
        {
          type: 'separator',
        },
        {
          label: 'Zoom In',
          accelerator: 'Cmd+=',
          click: (item, win) => sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_ZOOM_IN),
        },
        {
          label: 'Zoom Out',
          accelerator: 'Cmd+-',
          click: (item, win) => sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_ZOOM_OUT),
        },
        {
          label: 'Reset Zoom',
          accelerator: 'Cmd+0',
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
          accelerator: 'Shift+Cmd+9',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_TOGGLE_DB_SEARCH),
        },
        {
          label: 'Search database objects',
          accelerator: 'Cmd+9',
          click: (item, win) =>
            sendMessage(win as BrowserWindow, eventKeys.BROWSER_MENU_TOGGLE_DB_OBJS_SEARCH),
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Cmd+M',
          // @ts-ignore
          selector: 'performMiniaturize:',
        },
        {
          label: 'Close',
          accelerator: 'Cmd+Shift+W',
          // @ts-ignore
          selector: 'performClose:',
        },
        {
          type: 'separator',
        },
        {
          label: 'Bring All to Front',
          // @ts-ignore
          selector: 'arrangeInFront:',
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
      ],
    },
  ];
}

export function buildTemplateDockMenu(
  app: App,
  buildNewWindow: BuildWindow,
): Array<MenuItemConstructorOptions> {
  return [{ label: 'New Window', click: () => buildNewWindow(app) }];
}
