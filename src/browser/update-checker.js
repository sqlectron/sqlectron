import axios from 'axios';
import createLogger from './logger';

const logger = createLogger('gh-update-checker');
const WAIT_2_SECS = 2000;


export async function check(mainWindow, appConfig) {
  const currentVersion = `v${appConfig.version}`;
  logger.debug('current version %s', currentVersion);

  const repo = appConfig.repository.url.replace('https://github.com/', '');
  const latestReleaseURL = `https://api.github.com/repos/${repo}/releases/latest`;
  const response = await axios.get(latestReleaseURL);

  logger.debug('latest version %s', response.data.tag_name);
  if (currentVersion === response.data.tag_name) {
    logger.debug('already using the latest version');
    return;
  }

  // give some time to the render process be ready
  setTimeout(
    () => mainWindow.webContents.send('sqlectron:update-available'),
    WAIT_2_SECS,
  );
}
