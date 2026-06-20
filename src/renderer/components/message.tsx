import { X } from 'lucide-react';
import React, { FC, useState } from 'react';

import { cn } from '../lib/utils';

interface Props {
  closeable?: boolean;
  type?: string;
  title?: string;
  message?: string;
  preformatted?: boolean;
}

const TYPE_STYLES: Record<string, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  negative: 'border-red-200 bg-red-50 text-red-800',
};

const Message: FC<Props> = ({ closeable, type, title, message, preformatted }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative my-2 rounded-md border p-3 text-sm',
        (type && TYPE_STYLES[type]) || 'border-slate-200 bg-slate-50 text-slate-800',
      )}
    >
      {closeable && (
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="absolute right-2 top-2 text-current opacity-60 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {title && <div className="font-semibold">{title}</div>}
      {message && preformatted ? (
        <pre className="whitespace-pre-wrap">{message}</pre>
      ) : (
        <p className="m-0">{message}</p>
      )}
    </div>
  );
};

Message.displayName = 'Message';

export default Message;
