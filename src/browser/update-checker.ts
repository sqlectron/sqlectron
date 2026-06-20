import { BrowserWindow } from 'electron';

import * as event from '../common/event';
import { Config } from '../common/types/config';

import createLogger from './logger';

const logger = createLogger('gh-update-checker');

export async function check(mainWindow: BrowserWindow, appConfig: Config): Promise<void> {
  const currentVersion = `v${appConfig.version}`;
  logger.debug('current version %s', currentVersion);

  const repo = appConfig.repository?.url.replace('https://github.com/', '');
  const latestReleaseURL = `https://api.github.com/repos/${repo}/releases/latest`;
  const response = await fetch(latestReleaseURL);
  if (!response.ok) {
    logger.error('Failed to check for updates: %s (%d)', response.statusText, response.status);
    return;
  }
  const data = await response.json();

  logger.debug('latest version %s', data.tag_name);

  if (currentVersion === data.tag_name) {
    logger.debug('already using the latest version');
    return;
  }

  mainWindow.webContents.send(event.UPDATE_AVAILABLE, currentVersion, data.tag_name);
}
