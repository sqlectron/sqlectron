const fs = require('fs');
const path = require('path');

/** @param {import('electron-builder').AfterPackContext} context */
exports.default = async function afterPack({ appOutDir, packager }) {
  if (packager.platform.name !== 'linux') {
    return;
  }

  const executableName = packager.executableName;
  const binaryPath = path.join(appOutDir, executableName);
  const renamedBinaryPath = path.join(appOutDir, `${executableName}-bin`);

  fs.renameSync(binaryPath, renamedBinaryPath);

  const launcherSrc = path.join(__dirname, 'linux-launcher.sh');
  fs.copyFileSync(launcherSrc, binaryPath);
  fs.chmodSync(binaryPath, 0o755);
};
