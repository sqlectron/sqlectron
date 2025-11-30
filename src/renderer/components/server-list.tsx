import React, { FC } from 'react';

import ServerListCard from './server-list-card';
import ServerListItem from './server-list-item';
import Message from './message';
import type { Server } from '../../common/types/server';
import type { ConfigState } from '../reducers/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./server-list.scss');

interface Props {
  servers: Server[];
  onEditClick: (server: Server) => void;
  onConnectClick: (server: Server) => void;
  config: ConfigState;
}

const itemsPerRow = 4;

const ServerList: FC<Props> = ({ servers, onEditClick, onConnectClick, config }) => {
  if (!servers.length) {
    return <Message message="No results" type="info" />;
  }

  return (
    <div id="server-list">
      {config.data?.connectionsAsList ? (
        <div className="ui divided items">
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
        servers
          .reduce<Server[][]>((rows, item, index) => {
            const position = Math.floor(index / itemsPerRow);
            if (!rows[position]) {
              rows[position] = []; // eslint-disable-line no-param-reassign
            }

            rows[position].push(item);
            return rows;
          }, [])
          .map((row, rowIdx) => (
            <div key={rowIdx} className="ui cards">
              {row.map((server) => (
                <ServerListCard
                  key={server.id}
                  onConnectClick={() => onConnectClick(server)}
                  onEditClick={() => onEditClick(server)}
                  server={server}
                />
              ))}
            </div>
          ))
      )}
    </div>
  );
};

ServerList.displayName = 'ServerList';

export default ServerList;
