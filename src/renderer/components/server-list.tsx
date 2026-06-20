import React, { FC } from 'react';

import type { Server } from '../../common/types/server';
import type { ConfigState } from '../reducers/config';

import Message from './message';
import ServerListCard from './server-list-card';
import ServerListItem from './server-list-item';

interface Props {
  servers: Server[];
  onEditClick: (server: Server) => void;
  onConnectClick: (server: Server) => void;
  config: ConfigState;
}

const ServerList: FC<Props> = ({ servers, onEditClick, onConnectClick, config }) => {
  if (!servers.length) {
    return <Message message="No results" type="info" />;
  }

  return (
    <div id="server-list">
      {config.data?.connectionsAsList ? (
        <div className="flex flex-col divide-y divide-slate-200">
          {servers.map((server) => (
            <ServerListItem
              key={server.id}
              onConnectClick={() => onConnectClick(server)}
              onEditClick={() => onEditClick(server)}
              server={server}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {servers.map((server) => (
            <ServerListCard
              key={server.id}
              onConnectClick={() => onConnectClick(server)}
              onEditClick={() => onEditClick(server)}
              server={server}
            />
          ))}
        </div>
      )}
    </div>
  );
};

ServerList.displayName = 'ServerList';

export default ServerList;
