import { Loader2 } from 'lucide-react';
import React, { FC } from 'react';

import { cn } from '../lib/utils';

interface Props {
  message?: string;
  type: 'active' | 'page';
  inverted?: boolean;
}

const Loader: FC<Props> = ({ message, type, inverted = false }) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-sm font-medium',
        type === 'page' ? 'fixed inset-0 z-50' : 'absolute inset-0',
        inverted ? 'bg-white/80 text-slate-900' : 'bg-slate-900/80 text-white',
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin" />
      {message && <div>{message}</div>}
    </div>
  );
};

Loader.displayName = 'Loader';

export default Loader;
