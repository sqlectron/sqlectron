import { app, dialog } from 'electron';
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer';

import { registerIPCMainHandlers } from './ipcMain';
import createLogger from './logger';
import { buildNewWindow } from './window';

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
    installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
      .then((exts) => exts.forEach((ext) => logger.info(`Loaded extension: ${ext.name}`)))
      .catch((err) => logger.error(`Error loading extension: ${err}`));
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
