import { Pencil, Plug } from 'lucide-react';
import React, { FC } from 'react';

import { Server } from '../../common/types/server';
import { DB_CLIENTS } from '../api';

import { requireClientLogo } from './require-context';
import { Button } from './ui/button';

/**
 * Load icons for supported database clients
 */
const ICONS = DB_CLIENTS.reduce((clients, dbClient) => {
  clients[dbClient.key] = requireClientLogo(dbClient.key);
  return clients;
}, {});

interface Props {
  server: Server;
  onConnectClick: () => void;
  onEditClick: () => void;
}

const ServerListCard: FC<Props> = ({ server, onConnectClick, onEditClick }) => (
  <div className="flex flex-col rounded-md border border-slate-200 bg-white shadow-sm">
    <div className="relative flex flex-1 items-start gap-2.5 p-3">
      <img alt="client" className="h-[35px] w-[35px] shrink-0" src={ICONS[server.client]} />
      <div className="min-w-0 flex-1 pr-7">
        <div data-testid="server-name" className="truncate text-sm font-semibold text-slate-900">
          {server.name}
        </div>
        <div data-testid="server-meta" className="break-all text-xs text-slate-500">
          {server.host ? `${server.host}:${server.port}` : server.socketPath}
          {server.ssh && <div>via {server.ssh.host}</div>}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="absolute right-2 top-2 h-7 w-7 rounded-full p-0"
        title="Edit"
        onClick={onEditClick}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
    <Button
      data-testid="connect-button"
      variant="outline"
      className="w-full shrink-0 rounded-t-none rounded-b-md border-x-0 border-b-0 border-t-slate-200"
      onClick={onConnectClick}
    >
      <Plug className="h-4 w-4" />
      Connect
    </Button>
  </div>
);

ServerListCard.displayName = 'ServerListCard';

export default ServerListCard;
