import React from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface ConfirmModalProps {
  title: string;
  message: string;
  onCancelClick: () => void;
  onRemoveClick: () => void;
}

const ConfirmModal = ({ onCancelClick, onRemoveClick, title, message }: ConfirmModalProps) => {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancelClick()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancelClick}>
            No
          </Button>
          <Button variant="positive" onClick={onRemoveClick}>
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmModal;
