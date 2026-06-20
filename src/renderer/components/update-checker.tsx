import { CloudDownload } from 'lucide-react';
import React, { FC, MouseEvent, useEffect, useState } from 'react';

import { CONFIG, sqlectron } from '../api';

const repo = CONFIG.repository?.url.replace('https://github.com/', '');
const LATEST_RELEASE_URL = `https://github.com/${repo}/releases/latest`;

const UpdateChecker: FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  // const [currentVersion, setCurrentVersion] = useState('');
  const [latestVersion, setLatestVersion] = useState('');

  const updateAvailable = (_currentVersion: string, latestVersion: string) => {
    // setCurrentVersion(currentVersion);
    setLatestVersion(latestVersion);
    setIsVisible(true);
  };

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    sqlectron.browser.shell.openExternal(LATEST_RELEASE_URL);
  };

  useEffect(() => {
    const unsub = sqlectron.update.onUpdateAvailable(updateAvailable);
    sqlectron.update.checkUpdateAvailable();

    return unsub;
  }, []);

  return (
    <>
      {isVisible && (
        <a
          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700 hover:bg-green-100"
          onClick={onClick}
        >
          <CloudDownload className="h-3 w-3" />
          Update available: {latestVersion}
        </a>
      )}
    </>
  );
};

UpdateChecker.displayName = 'UpdateChecker';

export default UpdateChecker;
