import React, { FC } from 'react';
import { Pencil, Plug } from 'lucide-react';
import { requireClientLogo } from './require-context';
import { DB_CLIENTS } from '../api';
import { Server } from '../../common/types/server';
import { Button } from './ui/button';

/**
 * Load icons for supported database clients
 */
const ICONS = DB_CLIENTS.reduce((clients, dbClient) => {
  /* eslint no-param-reassign:0 */
  clients[dbClient.key] = requireClientLogo(dbClient.key);
  return clients;
}, {});

interface Props {
  server: Server;
  onConnectClick: () => void;
  onEditClick: () => void;
}

const ServerListItem: FC<Props> = ({ server, onConnectClick, onEditClick }) => (
  <div className="flex items-center gap-3 px-3 py-2.5">
    <img alt="client" className="h-8 w-8 shrink-0" src={ICONS[server.client]} />
    <div className="min-w-0 flex-1">
      <div data-testid="server-name" className="truncate text-sm font-semibold text-slate-900">
        {server.name}
      </div>
      <div data-testid="server-meta" className="break-all text-xs text-slate-500">
        {server.host ? `${server.host}:${server.port}` : server.socketPath}
        {server.ssh && <div>via {server.ssh.host}</div>}
      </div>
    </div>
    <Button variant="outline" size="sm" title="Edit" onClick={onEditClick}>
      <Pencil className="h-3.5 w-3.5" />
    </Button>
    <Button data-testid="connect-button" variant="outline" size="sm" onClick={onConnectClick}>
      <Plug className="h-4 w-4" />
      Connect
    </Button>
  </div>
);

ServerListItem.displayName = 'ServerListItem';

export default ServerListItem;
