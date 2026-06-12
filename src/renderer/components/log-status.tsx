import React, { FC } from 'react';
import { Terminal } from 'lucide-react';
import { CONFIG } from '../api';

const log = CONFIG.log;

const LogStatus: FC = () => {
  if (!log.console && !log.file) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700">
      <Terminal className="h-3 w-3" />
      Log
      <span className="font-semibold uppercase">{log.level}</span>
    </div>
  );
};

export default LogStatus;
