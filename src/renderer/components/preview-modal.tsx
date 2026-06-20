import isPlainObject from 'lodash/isPlainObject';
import React, { FC, useCallback, useState } from 'react';

import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

interface Props {
  value: unknown;
  onCloseClick: () => void;
}

const PreviewModal: FC<Props> = ({ value, onCloseClick }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const getPreviewValue = useCallback(
    (type: string | null) => {
      try {
        switch (type) {
          case 'plain':
            return isPlainObject(value) ? JSON.stringify(value) : (value as string);
          case 'json':
            return <pre>{JSON.stringify(value, null, 2)}</pre>;
          default:
            return value as string;
        }
      } catch {
        return 'Not valid format';
      }
    },
    [value],
  );

  const items = [
    { type: 'plain', name: 'Plain Text' },
    { type: 'json', name: 'JSON' },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onCloseClick()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Content Preview</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          {items.map((item) => (
            <Button
              key={item.type}
              variant={(selected || 'plain') === item.type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelected(item.type)}
            >
              {item.name}
            </Button>
          ))}
        </div>
        <div className="rounded-md border border-slate-200 p-4">
          <div style={{ maxHeight: '500px', overflowY: 'scroll' }}>
            {getPreviewValue(selected || 'plain')}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCloseClick}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

PreviewModal.displayName = 'PreviewModal';
export default PreviewModal;
