const dotenv = require('dotenv');
const { notarize } = require('@electron/notarize');
const fs = require('fs');
const path = require('path');

if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
  dotenv.config({
    path: path.resolve(path.join(__dirname, '..', '.env')),
  });
}

exports.default = async (context) => {
  if (process.env.SKIP_NOTARIZE === '1') {
    // eslint-disable-next-line no-console
    console.info('Skipping notarization');
    return;
  }

  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.info('Could not find Apple ID or password');
    return;
  }

  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);

  // eslint-disable-next-line no-console
  console.info(`Notarizing ${appName} found at ${appPath}`);

  return await notarize({
    appBundleId: 'desktop.sqlectron.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
