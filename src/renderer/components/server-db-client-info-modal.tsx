import React, { FC } from 'react';

import { DB_CLIENTS } from '../api';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface Props {
  client: string;
  infos: string[];
  onCloseClick: () => void;
}

const ServerDBClientInfoModal: FC<Props> = ({ client, infos, onCloseClick }) => {
  const dbClient = DB_CLIENTS.find((item) => item.key === client);

  if (!dbClient) {
    throw new Error('Unknown client');
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCloseClick()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dbClient.name} Query Information</DialogTitle>
          <DialogDescription>
            Some particularities about queries on {dbClient.name} you should know:
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {infos.map((info, idx) => (
            <li key={idx}>{info}</li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

ServerDBClientInfoModal.displayName = 'ServerDBClientInfoModal';
export default ServerDBClientInfoModal;
