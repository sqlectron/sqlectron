import React, { useState, useCallback } from 'react';
import { useHistory } from 'react-router';
import * as ServersActions from '../actions/servers';
import * as ConnActions from '../actions/connections';
import * as ConfigActions from '../actions/config';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import Header from '../components/header';
import Footer from '../components/footer';
import ServerList from '../components/server-list';
import ServerModalForm from '../components/server-modal-form';
import SettingsModalForm from '../components/settings-modal-form';
import ServerFilter from '../components/server-filter';
import Message from '../components/message';
import { Server } from '../../common/types/server';
import { escapeRegExpString } from '../utils/regexp';

const BREADCRUMB = [{ icon: 'server', label: 'servers' }];

function filterServers(name: string, servers: Server[]): Server[] {
  const regex = RegExp(escapeRegExpString(name), 'i');
  return servers.filter((srv) => regex.test(srv.name));
}

const ServerManagement = () => {
  const history = useHistory();
  const [filter, setFilter] = useState('');
  const dispatch = useAppDispatch();

  const { connections, servers, config, status } = useAppSelector((state) => ({
    connections: state.connections,
    servers: state.servers,
    config: state.config,
    status: state.status,
  }));

  const onFilterChange = useCallback(
    (event) => {
      setFilter(event.target.value);
    },
    [setFilter],
  );

  const onConnectClick = useCallback(
    (server: Server) => {
      dispatch(ConnActions.setConnecting());
      history.push(`/server/${server.id}`);
    },
    [dispatch, history],
  );

  const onTestConnectionClick = useCallback(
    (server: Server) => {
      dispatch(ConnActions.test(server));
    },
    [dispatch],
  );

  const onAddClick = useCallback(() => dispatch(ServersActions.startEditing()), [dispatch]);

  const onSettingsClick = useCallback(() => dispatch(ConfigActions.startEditing()), [dispatch]);

  const onEditClick = useCallback((server) => dispatch(ServersActions.startEditing(server.id)), [
    dispatch,
  ]);

  const onDuplicateClick = useCallback(
    (server: Server) => dispatch(ServersActions.duplicateServer({ server })),
    [dispatch],
  );

  const onSaveClick = useCallback(
    (server: Server) => {
      const id = servers.editingServer?.id;
      dispatch(ServersActions.saveServer({ id, server }));
    },
    [dispatch, servers],
  );

  const onCancelClick = useCallback(() => dispatch(ServersActions.finishEditing()), [dispatch]);

  const onRemoveClick = useCallback(() => {
    const id = servers.editingServer?.id;
    if (!id) {
      return;
    }
    dispatch(ServersActions.removeServer({ id }));
  }, [dispatch, servers]);

  const onSettingsSaveClick = useCallback((config) => dispatch(ConfigActions.saveConfig(config)), [
    dispatch,
  ]);

  const onSettingsCancelClick = useCallback(() => dispatch(ConfigActions.finishEditing()), [
    dispatch,
  ]);

  const selected = servers.editingServer || {};
  const filteredServers = filterServers(filter, servers.items);

  return (
    <div style={{ paddingTop: '50px' }}>
      <div>
        <Header items={BREADCRUMB} />
      </div>
      <div style={{ padding: '10px 10px 50px 10px' }}>
        <ServerFilter
          onFilterChange={onFilterChange}
          onAddClick={onAddClick}
          onSettingsClick={onSettingsClick}
        />

        {connections.error && (
          <Message
            closeable
            title="Connection Error"
            message={connections.error.message}
            type="error"
          />
        )}

        <ServerList
          servers={filteredServers}
          onEditClick={onEditClick}
          onConnectClick={onConnectClick}
          config={config}
        />

        {servers.isEditing && (
          <ServerModalForm
            server={selected}
            error={servers.error}
            onTestConnectionClick={onTestConnectionClick}
            onDuplicateClick={onDuplicateClick}
            onSaveClick={onSaveClick}
            onCancelClick={onCancelClick}
            onRemoveClick={onRemoveClick}
          />
        )}

        {config.isEditing && (
          <SettingsModalForm
            config={config}
            error={config.error}
            onSaveClick={onSettingsSaveClick}
            onCancelClick={onSettingsCancelClick}
          />
        )}
      </div>
      <div>
        <Footer status={status} />
      </div>
    </div>
  );
};

ServerManagement.displayName = 'ServerManagement';

export default ServerManagement;
