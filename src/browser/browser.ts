import electron, {
  WebContents,
  BrowserWindow,
  Menu,
  MenuItem,
  IpcMainInvokeEvent,
  shell,
  clipboard,
} from 'electron';
import fs from 'fs';

import {
  SqlectronBrowser,
  SqlectronBrowserDialog,
  SqlectronBrowserFS,
  SqlectronBrowserMenu,
  SqlectronBrowserShell,
  SqlectronBrowserClipboard,
  SqlectronBrowserWebFrame,
  DialogFilter,
  MenuOptions,
  MenuItem as MenuItemOption,
  ListenerUnsub,
} from '../common/types/api';

const failNotImplemented = () => {
  throw new Error('This is a function implemented only in the preload section');
};

const contextMenus: {
  [menuId: string]: Menu;
} = {};

/***
 * Facade to expose the file system API to the renderer process
 */
const fsFacade: SqlectronBrowserFS = {
  saveFile: (fileName: string, data: unknown, encoding = 'utf8'): Promise<void> => {
    return new Promise((resolve, reject) => {
      fs.writeFile(
        fileName,
        data as string | NodeJS.ArrayBufferView,
        encoding as BufferEncoding,
        (err) => {
          if (err) {
            return reject(err);
          }
          return resolve();
        },
      );
    });
  },
  openFile: (fileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      fs.readFile(fileName, 'utf8', (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  },
};

/***
 * Facade to expose Electron dialog API to the renderer process
 */
const dialogFacade: SqlectronBrowserDialog = {
  showSaveDialog: async (filters: Array<DialogFilter>): Promise<string> => {
    const dialogObject = await electron.dialog.showSaveDialog({
      filters,
    });

    return dialogObject.canceled ? '' : (dialogObject.filePath as string);
  },

  showOpenDialog: async (filters: Array<DialogFilter>, defaultPath?: string): Promise<string[]> => {
    const dialogObject = await electron.dialog.showOpenDialog({
      defaultPath,
      filters,
      properties: ['openFile'],
    });

    if (dialogObject.canceled || dialogObject.filePaths.length === 0) {
      return [];
    }

    return dialogObject.filePaths;
  },
};

/***
 * Facade to expose the Electron menu API to the renderer process
 */
const menuFacade: SqlectronBrowserMenu = {
  buildContextMenu: (menuId: string, options: MenuOptions, event?: IpcMainInvokeEvent) => {
    contextMenus[menuId] = new Menu();
    options.menuItems.forEach((menuItem: MenuItemOption) => {
      let item: MenuItem | null = null;

      if (menuItem.type === 'separator') {
        item = new MenuItem({ type: 'separator' });
      } else {
        item = new MenuItem({
          label: menuItem.label,
          click: () => event?.sender.send(`${menuItem.event}@${menuId}`),
        });
      }

      contextMenus[menuId].append(item);
    });
  },
  popupContextMenu: (
    menuId: string,
    position: { x: number; y: number },
    event?: IpcMainInvokeEvent,
  ) => {
    const sourceWindow = BrowserWindow.fromWebContents(event?.sender as WebContents);
    if (!sourceWindow?.isFocused()) {
      return;
    }

    contextMenus[menuId]?.popup(position);
  },

  // Dummy implementation to fulfill the interface contract.
  // The real implementation only exists on preload.
  onMenuClick:
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (menuEvent: string, cb: () => void): ListenerUnsub =>
      () =>
        failNotImplemented(),
};

/***
 * Facade to expose the Electron shell API to the renderer process
 */
const shellFacade: SqlectronBrowserShell = {
  openExternal: (url: string): Promise<void> => shell.openExternal(url),
};

/***
 * Facade to expose the Electron clipboard API to the renderer process
 */
const clipboardFacade: SqlectronBrowserClipboard = {
  writeText: (text: string): void => clipboard.writeText(text),
};

/***
 * Facade to expose the Electron web frame API to the renderer process
 */
const webFrameFacade: SqlectronBrowserWebFrame = {
  setZoomFactor: (zoom: number, event?: IpcMainInvokeEvent): void =>
    event?.sender.setZoomFactor(zoom),
};

/***
 * Facade to expose general browser/backend API to the renderer process
 */
const browserFacade: SqlectronBrowser = {
  dialog: dialogFacade,
  fs: fsFacade,
  menu: menuFacade,
  shell: shellFacade,
  clipboard: clipboardFacade,
  webFrame: webFrameFacade,
};

export default browserFacade;
