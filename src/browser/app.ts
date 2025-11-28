import { app, dialog } from 'electron';
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer';

import createLogger from './logger';
import { buildNewWindow } from './window';
import { registerIPCMainHandlers } from './ipcMain';

async function loadExtension(extension) {
  try {
    const name = await installExtension(extension);
    // eslint-disable-next-line no-console
    console.log(`Loaded ${name}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Error loading extension: ${err}`);
  }
}

const logger = createLogger('app');

// TODO: Create a server to receive the crash reports
// Report crashes to our server.
// require('crash-reporter').start({
//   productName: 'Sqlectron',
//   companyName: 'Sqlectron',
//   submitURL: 'https://your-domain.com/url-to-submit',
//   autoSubmit: true
// });

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.whenReady().then(async () => {
  registerIPCMainHandlers();

  if (process.env.NODE_ENV === 'development' || process.env.DEV_TOOLS === 'true') {
    // Disabling React DevTools as they don't load properly with the current Electron version
    /*loadExtension(REACT_DEVELOPER_TOOLS),*/
    await Promise.all([loadExtension(REDUX_DEVTOOLS)]);
  }

  buildNewWindow(app);
});

app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event) => {
    // Disables in-app navigation
    event.preventDefault();
  });

  contents.setWindowOpenHandler(() => {
    // Disables opening new windows with window.open()
    return { action: 'deny' };
  });
});

// Show only the error description to the user
process.on('uncaughtException', (error) => {
  logger.error('uncaughtException', error);
  return dialog.showErrorBox('An error occurred', error.name + ': ' + error.message);
});
