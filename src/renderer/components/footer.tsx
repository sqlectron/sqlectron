import React, { FC, MouseEvent } from 'react';
import { Keyboard } from 'lucide-react';

import { sqlectron } from '../api';
import UpdateChecker from './update-checker';
import LogStatus from './log-status';

interface Props {
  status: string;
}

const Footer: FC<Props> = ({ status }) => {
  const onGithubClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    sqlectron.browser.shell.openExternal('https://github.com/sqlectron/sqlectron-gui');
  };

  const onShortcutsClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    sqlectron.browser.shell.openExternal(
      'https://github.com/sqlectron/sqlectron-gui/wiki/Keyboard-Shortcuts',
    );
  };

  return (
    <div className="fixed inset-x-0 bottom-0 flex h-8 items-center justify-between border-t border-slate-200 bg-white px-3 text-xs">
      <div>{status}</div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <LogStatus />
          <UpdateChecker />
        </div>
        <a href="#" className="hover:underline" onClick={onGithubClick}>
          GitHub
        </a>
        <a href="#" title="Keyboard Shortcuts" onClick={onShortcutsClick}>
          <Keyboard className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
};

Footer.displayName = 'Footer';

export default Footer;
