import { resolve } from 'path';
import { BrowserWindow, ipcMain, Menu } from 'electron';
import { attachMenuToWindow } from './menu';
import { check as checkUpdate } from './update-checker';
import { get as getConfig } from './config';
import createLogger from './logger';

const logger = createLogger('window');

const devMode = (process.argv || []).indexOf('--dev') !== -1;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
const WINDOWS = {};

// Indicate the number of windows has already been opened.
// Also used as identifier to for each window.
let windowsNumber = 0;

export function buildNewWindow(app) {
  const appConfig = getConfig();

  windowsNumber += 1;
  const mainWindow = new BrowserWindow({
    title: appConfig.name,
    icon: resolve(__dirname, '..', '..', 'build', 'app.png'),
    width: 1024,
    height: 700,
    minWidth: 512,
    minHeight: 350,
    webPreferences: {
      preload: resolve(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  attachMenuToWindow(app, buildNewWindow, appConfig);

  // and load the index.html of the app.
  let entryBasePath = 'file://' + resolve(__dirname, '..');
  if (devMode) {
    entryBasePath = 'http://localhost:8080';
  }

  const appUrl = entryBasePath + '/static/index.html';

  mainWindow.loadURL(appUrl);

  // block navigation that would lead outside the application
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (url === appUrl) {
      return;
    }
    e.preventDefault();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => delete WINDOWS[windowsNumber]);

  if (devMode || process.env.DEV_TOOLS === 'true') {
    mainWindow.openDevTools();
    mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;
      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click() {
            mainWindow.inspectElement(x, y);
          },
        },
      ]).popup(mainWindow);
    });
  }

  ipcMain.on('sqlectron:check-upgrade', () => {
    checkUpdate(mainWindow, appConfig).catch((err) =>
      logger.error('Unable to check for updates', err)
    );
  });
}
