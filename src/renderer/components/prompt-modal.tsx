import React, { ChangeEvent, FC, KeyboardEvent, useCallback, useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';

interface Props {
  onCancelClick: () => void;
  onOKClick: (value: string) => void;
  title: string;
  message: string;
  type: string;
}

const PromptModal: FC<Props> = ({ onCancelClick, onOKClick, title, message, type }) => {
  const [value, setValue] = useState('');

  const handleKeyPress = useCallback(
    (event: KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter') {
        onOKClick(value);
      }
    },
    [onOKClick, value],
  );

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    setValue(event?.target.value);
  }, []);

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <Input autoFocus type={type} onChange={handleChange} onKeyPress={handleKeyPress} />
        <DialogFooter>
          <Button variant="outline" onClick={onCancelClick}>
            Cancel
          </Button>
          <Button variant="positive" onClick={() => onOKClick(value)}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

PromptModal.displayName = 'PromptModal';
export default PromptModal;
