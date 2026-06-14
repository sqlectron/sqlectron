import React, { FC } from 'react';
import { Terminal } from 'lucide-react';
import { useAppSelector } from '../hooks/redux';

const LogStatus: FC = () => {
  const log = useAppSelector((state) => state.config.data?.log);
  if (!log || (!log.console && !log.file)) {
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
