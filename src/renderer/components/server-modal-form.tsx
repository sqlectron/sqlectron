import { ConnectionString } from 'connection-string';
import { cloneDeep, set } from 'lodash';
import { Copy, Eye, EyeOff, FolderOpen, Loader2, Plug, Trash2 } from 'lucide-react';
import React, { ChangeEvent, FC, ReactElement, useCallback, useState } from 'react';
import Select from 'react-select';

import { Server } from '../../common/types/server';
import { titlize } from '../../common/utils/string';
import { DB_CLIENTS } from '../api';
import { useAppSelector } from '../hooks/redux';
import { cn } from '../lib/utils';
import { ValidationErrors } from '../reducers/servers';

import Checkbox from './checkbox';
import ConfirmModal from './confim-modal';
import Message from './message';
import { requireClientLogo } from './require-context';
import { Button, buttonVariants } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';

const CLIENTS = DB_CLIENTS.map((dbClient) => ({
  value: dbClient.key,
  logo: requireClientLogo(dbClient.key),
  label: dbClient.name,
  defaultPort: dbClient.defaultPort,
  disabledFeatures: dbClient.disabledFeatures,
}));

const DEFAULT_SSH_PORT = 22;

const ERROR_SELECT_STYLES = {
  control: (styles) => ({
    ...styles,
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    color: '#b91c1c',
  }),
};

const buildConnectionURI = (showPlainPassword: boolean, server: Partial<Server>): string => {
  try {
    const clientConfig = DB_CLIENTS.find((entry) => entry.key === server.client);
    const passwordHash = showPlainPassword ? false : '*';

    const conn = new ConnectionString(null, {
      protocol: clientConfig ? clientConfig.protocol : '',
      user: server.user,
      password: server.password as string,
      path: server.database ? [server.database] : undefined,
      hosts: [
        {
          name: server.host,
          port: server.port,
        },
      ],
    });

    return conn.toString({ passwordHash });
  } catch {
    // Ignore error, it just means the data is not ready to be parsed into the URI format yet
    return '';
  }
};

const mapStateToServer = (state: FormServer): Server => {
  // The type assertion here is fine, as we do a validation check before saving
  // within the core.
  const server: Server = {
    name: state.name,
    client: state.client,
    ssl: !!state.ssl,
    user: state.user || null,
    password: state.password || null,
    database: state.database,
    domain: state.domain,
    schema: state.schema || null,
  } as Server;

  if (state.host && state.host.length) {
    server.host = state.host;
    server.port = state.port || state.defaultPort;
  } else if (state.socketPath && state.socketPath.length) {
    server.socketPath = state.socketPath;
  }

  const { ssh } = state;
  if (ssh) {
    server.ssh = {
      host: ssh.host,
      port: ssh.port || DEFAULT_SSH_PORT,
      user: ssh.user,
      password: ssh.password && (ssh.password as string).length ? ssh.password : null,
      privateKey: ssh.privateKey && ssh.privateKey.length ? ssh.privateKey : null,
      useAgent: !!ssh.useAgent,
      privateKeyWithPassphrase: !!ssh.privateKeyWithPassphrase,
    };
  }

  const { filter } = state;
  if (filter) {
    server.filter = {};
    for (const type of ['database', 'schema']) {
      if (!filter[type]) {
        continue;
      }

      server.filter[type] = {
        only: (filter[type].only || []).filter((val) => val),
        ignore: (filter[type].ignore || []).filter((val) => val),
      };

      if (!server.filter[type].only.length && !server.filter[type].ignore.length) {
        delete server.filter[type];
      }
    }

    if (!Object.keys(server.filter).length) {
      delete server.filter;
    }
  }

  return server;
};

const renderClientItem = ({ label, logo }: { label: string; logo: string }): ReactElement => {
  return (
    <div className="flex items-center gap-2">
      <img alt="logo" src={logo} style={{ width: '16px' }} />
      <div>{label}</div>
    </div>
  );
};

interface FileBrowseButtonProps {
  id: string;
  name: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const FileBrowseButton: FC<FileBrowseButtonProps> = ({ id, name, disabled, onChange }) => (
  <label
    htmlFor={id}
    className={cn(
      buttonVariants({ variant: 'outline', size: 'sm' }),
      'cursor-pointer',
      disabled && 'pointer-events-none opacity-50',
    )}
  >
    <FolderOpen className="h-4 w-4" />
    <input
      type="file"
      id={id}
      name={name}
      onChange={onChange}
      disabled={disabled}
      className="hidden"
    />
  </label>
);

type FormServer = Partial<Server> & { defaultPort?: number };
type FormSSH = Partial<Server['ssh']>;

interface Props {
  onSaveClick: (server: Server) => void;
  onCancelClick: () => void;
  onRemoveClick: () => void;
  onTestConnectionClick: (server: Server) => void;
  onDuplicateClick: (server: Server) => void;
  server: Partial<Server>;
  error: ValidationErrors | null;
}
const ServerModalForm: FC<Props> = ({
  onSaveClick,
  onCancelClick,
  onRemoveClick,
  onTestConnectionClick,
  onDuplicateClick,
  server,
  error,
}) => {
  const testConnection = useAppSelector((state) => ({
    connected: state.connections.testConnected,
    connecting: state.connections.testConnecting,
    error: state.connections.testError,
  }));

  const [serverState, setServerState] = useState<FormServer>(cloneDeep(server || {}));
  const [showPlainPassword, setShowPlainPassword] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [connURI, setConnURI] = useState(
    server.id ? buildConnectionURI(showPlainPassword, server) : '',
  );

  const isNew = !server.id;

  const updateServerState = useCallback(
    (newState: FormServer): void => {
      setServerState({ ...serverState, ...newState });
    },
    [serverState],
  );
  const handleOnClientChange = useCallback(
    (selected) => {
      const client = selected.value;
      const newState: { client: string; defaultPort?: number } = { client };

      const clientConfig = CLIENTS.find((entry) => entry.value === client);
      if (clientConfig && clientConfig.defaultPort) {
        newState.defaultPort = clientConfig.defaultPort;
      }

      updateServerState(newState);

      const newConnURI = buildConnectionURI(showPlainPassword, { ...serverState, ...newState });
      if (newConnURI) {
        setConnURI(newConnURI);
      }
    },
    [serverState, updateServerState, showPlainPassword],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      const newState = {};
      const { target } = event;
      let value: string | string[] =
        'files' in target && target.files ? target.files[0].path : target.value;
      const name = target.name.replace(/^file\./, '');
      const [name1, name2] = name.split('.');

      if (name1 && name2) {
        newState[name1] = { ...serverState[name1] };
      }

      if (name1 === 'filter') {
        value = value.split('\n');
      }

      set(newState, name, value);

      const newConnURI = buildConnectionURI(showPlainPassword, {
        ...serverState,
        ...newState,
      });
      if (newConnURI) {
        setConnURI(newConnURI);
      }

      updateServerState(newState);
    },
    [serverState, updateServerState, showPlainPassword],
  );

  const handleURIChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const newState = {};
      const { value } = event.target;
      setConnURI(value);

      try {
        const data = new ConnectionString(value);

        const clientConfig = DB_CLIENTS.find((entry) => entry.protocol === data.protocol);

        set(newState, 'client', clientConfig ? clientConfig.key : '');
        set(newState, 'user', data.user);
        set(newState, 'password', data.password);
        set(newState, 'database', data.path && data.path[0]);
        set(newState, 'host', data.hostname);
        set(newState, 'port', data.port);
      } catch {
        // Ignore error, it just means the data is not ready to be parsed from the URI format yet
        return;
      }

      updateServerState(newState);
    },
    [updateServerState],
  );

  const handleSaveClick = useCallback(() => {
    onSaveClick(mapStateToServer(serverState));
  }, [onSaveClick, serverState]);

  const onRemoveCancelClick = useCallback(() => {
    setConfirmingRemove(false);
  }, []);

  const onRemoveConfirmClick = useCallback(() => {
    onRemoveClick();
  }, [onRemoveClick]);

  const onRemoveOpenClick = useCallback(() => {
    setConfirmingRemove(true);
  }, []);

  const handleTestConnectionClick = useCallback(() => {
    onTestConnectionClick(mapStateToServer(serverState));
  }, [onTestConnectionClick, serverState]);

  const handleDuplicateClick = useCallback(() => {
    onDuplicateClick(mapStateToServer(serverState));
  }, [onDuplicateClick, serverState]);

  const onToggleShowPlainPasswordClick = useCallback(() => {
    setShowPlainPassword(!showPlainPassword);

    const newConnURI = buildConnectionURI(!showPlainPassword, serverState);
    if (newConnURI) {
      setConnURI(newConnURI);
    }
  }, [showPlainPassword, serverState]);

  const isFeatureDisabled = useCallback(
    (feature) => {
      if (!serverState.client) {
        return false;
      }

      const dbClient = CLIENTS.find((dbc) => dbc.value === serverState.client);
      if (!dbClient) {
        throw new Error('Unknown client');
      }
      return !!(dbClient.disabledFeatures && ~dbClient.disabledFeatures.indexOf(feature));
    },
    [serverState],
  );

  const highlightError = useCallback(
    (name: string) => {
      return !!(error && error[name]);
    },
    [error],
  );

  const errorInputClass = useCallback(
    (name: string) => cn(highlightError(name) && 'border-red-400 focus-visible:ring-red-400'),
    [highlightError],
  );

  const errorLabelClass = useCallback(
    (name: string) => cn('text-sm font-medium', highlightError(name) && 'text-red-600'),
    [highlightError],
  );

  const isSSHChecked = !!serverState.ssh;
  const ssh: FormSSH = serverState.ssh || {};

  return (
    <Dialog open onOpenChange={(open) => !open && onCancelClick()}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Server Information</DialogTitle>
        </DialogHeader>

        {testConnection.error ? (
          <Message
            closeable
            title="Connection Error"
            message={testConnection.error.message}
            type="error"
          />
        ) : testConnection.connected ? (
          <Message
            closeable
            title="Connection Test"
            message="Successfully connected"
            type="success"
          />
        ) : null}

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6 flex flex-col gap-1">
              <label className={errorLabelClass('name')}>Name</label>
              <Input
                type="text"
                name="name"
                placeholder="Name"
                value={serverState.name || ''}
                onChange={handleChange}
                className={errorInputClass('name')}
              />
            </div>
            <div className="col-span-4 flex flex-col gap-1">
              <label className={errorLabelClass('client')}>Database Type</label>
              <Select
                name="client"
                placeholder="Select"
                styles={highlightError('client') ? ERROR_SELECT_STYLES : {}}
                formatOptionLabel={renderClientItem}
                options={CLIENTS}
                isClearable={false}
                onChange={handleOnClientChange}
                value={CLIENTS.find((c) => c.value === serverState.client)}
              />
            </div>
            <div className="col-span-2 mt-8 flex h-9 items-center">
              <Checkbox
                name="ssl"
                label="SSL"
                disabled={isFeatureDisabled('server:ssl')}
                checked={!!serverState.ssl}
                onChecked={() => updateServerState({ ssl: true })}
                onUnchecked={() => updateServerState({ ssl: false })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Server Address</label>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-4">
                <Input
                  type="text"
                  name="host"
                  placeholder="Host"
                  value={serverState.host || ''}
                  onChange={handleChange}
                  disabled={isFeatureDisabled('server:host') || !!serverState.socketPath}
                  className={errorInputClass('host')}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  name="port"
                  maxLength={5}
                  placeholder="Port"
                  value={serverState.port || serverState.defaultPort || ''}
                  onChange={handleChange}
                  disabled={isFeatureDisabled('server:port') || !!serverState.socketPath}
                  className={errorInputClass('port')}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="text"
                  name="domain"
                  placeholder="Domain"
                  value={serverState.domain || ''}
                  disabled={isFeatureDisabled('server:domain')}
                  onChange={handleChange}
                  className={errorInputClass('domain')}
                />
              </div>
              <div className="col-span-3 flex gap-2">
                <Input
                  type="text"
                  name="socketPath"
                  placeholder="Unix socket path"
                  value={serverState.socketPath || ''}
                  onChange={handleChange}
                  disabled={
                    !!serverState.host ||
                    !!serverState.port ||
                    isFeatureDisabled('server:socketPath')
                  }
                  className={errorInputClass('socketPath')}
                />
                <FileBrowseButton
                  id="file.socketPath"
                  name="file.socketPath"
                  onChange={handleChange}
                  disabled={
                    !!serverState.host ||
                    !!serverState.port ||
                    isFeatureDisabled('server:socketPath')
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className={errorLabelClass('user')}>User</label>
              <Input
                type="text"
                name="user"
                placeholder="User"
                value={serverState.user || ''}
                disabled={isFeatureDisabled('server:user')}
                onChange={handleChange}
                className={errorInputClass('user')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={errorLabelClass('password')}>Password</label>
              <div className="flex gap-2">
                <Input
                  type={showPlainPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={(serverState.password as string) || ''}
                  disabled={isFeatureDisabled('server:password')}
                  onChange={handleChange}
                  className={errorInputClass('password')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onToggleShowPlainPasswordClick}
                >
                  {showPlainPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className={errorLabelClass('database')}>Initial Database/Keyspace</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  name="database"
                  placeholder="Database"
                  value={serverState.database || ''}
                  onChange={handleChange}
                  className={errorInputClass('database')}
                />
                {serverState.client === 'sqlite' && (
                  <FileBrowseButton
                    id="file.database"
                    name="file.database"
                    onChange={handleChange}
                  />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className={errorLabelClass('schema')}>Initial Schema</label>
              <Input
                type="text"
                name="schema"
                maxLength={100}
                placeholder="Schema"
                disabled={isFeatureDisabled('server:schema')}
                value={serverState.schema || ''}
                onChange={handleChange}
                className={errorInputClass('schema')}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={errorLabelClass('name')}>URI</label>
            <Input
              type="text"
              name="connURI"
              placeholder="URI"
              disabled={!showPlainPassword}
              value={connURI || ''}
              onChange={handleURIChange}
              className={errorInputClass('name')}
            />
            <em
              className={cn('text-xs text-slate-500', showPlainPassword ? 'invisible' : 'visible')}
            >
              Make the password visible in order to change the database credentials through the URI
              format.
            </em>
          </div>

          {!isFeatureDisabled('server:ssh') && (
            <div className="space-y-3 rounded-md border border-slate-200 p-4">
              <Checkbox
                name="sshTunnel"
                label="SSH Tunnel"
                checked={isSSHChecked}
                onChecked={() =>
                  updateServerState({
                    ssh: { user: '', password: '', host: '', port: DEFAULT_SSH_PORT },
                  })
                }
                onUnchecked={() => updateServerState({ ssh: undefined })}
              />
              {isSSHChecked && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">SSH Address</label>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <Input
                          type="text"
                          name="ssh.host"
                          placeholder="Host"
                          disabled={!isSSHChecked}
                          value={ssh.host || ''}
                          onChange={handleChange}
                          className={errorInputClass('ssh.host')}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          name="ssh.port"
                          maxLength={5}
                          placeholder="Port"
                          disabled={!isSSHChecked}
                          value={ssh.port || DEFAULT_SSH_PORT}
                          onChange={handleChange}
                          className={errorInputClass('ssh.port')}
                        />
                      </div>
                      <div className="col-span-3 flex items-center">
                        <Checkbox
                          name="ssh.useAgent"
                          label="Use ssh agent"
                          disabled={!isSSHChecked}
                          checked={Boolean(ssh && ssh.useAgent)}
                          onChecked={() => {
                            const stateSSH: FormSSH = serverState.ssh ? { ...serverState.ssh } : {};
                            stateSSH.useAgent = true;
                            updateServerState({ ssh: stateSSH as Server['ssh'] });
                          }}
                          onUnchecked={() => {
                            const stateSSH: FormSSH = serverState.ssh ? { ...serverState.ssh } : {};
                            stateSSH.useAgent = false;
                            updateServerState({ ssh: stateSSH as Server['ssh'] });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 flex flex-col gap-1">
                      <label className={errorLabelClass('ssh.user')}>User</label>
                      <Input
                        type="text"
                        name="ssh.user"
                        placeholder="User"
                        disabled={!isSSHChecked}
                        value={ssh.user || ''}
                        onChange={handleChange}
                        className={errorInputClass('ssh.user')}
                      />
                    </div>
                    <div className="col-span-3 flex flex-col gap-1">
                      <label className={errorLabelClass('ssh.password')}>Password</label>
                      <Input
                        type="password"
                        name="ssh.password"
                        placeholder="Password"
                        disabled={!isSSHChecked || !!ssh.privateKey || ssh.useAgent}
                        value={(ssh.password as string) || ''}
                        onChange={handleChange}
                        className={errorInputClass('ssh.password')}
                      />
                    </div>
                    <div className="col-span-4 flex flex-col gap-1">
                      <label className={errorLabelClass('ssh.privateKey')}>Private Key</label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          name="ssh.privateKey"
                          placeholder="~/.ssh/id_rsa"
                          disabled={!isSSHChecked || !!ssh.password || ssh.useAgent}
                          value={ssh.privateKey || ''}
                          onChange={handleChange}
                          className={errorInputClass('ssh.privateKey')}
                        />
                        <FileBrowseButton
                          id="file.ssh.privateKey"
                          name="file.ssh.privateKey"
                          onChange={handleChange}
                          disabled={!isSSHChecked || !!ssh.password || ssh.useAgent}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 flex items-end pb-1">
                      <Checkbox
                        name="ssh.privateKeyWithPassphrase"
                        label="Passphrase"
                        disabled={!!(!isSSHChecked || ssh.password)}
                        checked={Boolean(ssh && ssh.privateKeyWithPassphrase)}
                        onChecked={() => {
                          const stateSSH: FormSSH = serverState.ssh ? { ...serverState.ssh } : {};
                          stateSSH.privateKeyWithPassphrase = true;
                          updateServerState({ ssh: stateSSH as Server['ssh'] });
                        }}
                        onUnchecked={() => {
                          const stateSSH: FormSSH = serverState.ssh ? { ...serverState.ssh } : {};
                          stateSSH.privateKeyWithPassphrase = false;
                          updateServerState({ ssh: stateSSH as Server['ssh'] });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 rounded-md border border-slate-200 p-4">
            <Checkbox
              name="filter"
              label="Filter"
              checked={!!serverState.filter}
              onChecked={() => updateServerState({ filter: {} })}
              onUnchecked={() => updateServerState({ filter: undefined })}
            />
            {!!serverState.filter && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Allow to pre filter the data available in the sidebar. It improves the rendering
                  performance for large servers.
                  <br />
                  Separate values by break line
                </p>
                {['database', 'schema'].map((type) => (
                  <div key={type} className="flex flex-col gap-1">
                    <label className="text-sm font-medium">{titlize(type)}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className={errorLabelClass(`filter.${type}.only`)}>Only</label>
                        <textarea
                          name={`filter.${type}.only`}
                          placeholder="Only"
                          rows={3}
                          value={
                            serverState.filter?.[type]?.only
                              ? serverState.filter[type].only.join('\n')
                              : ''
                          }
                          onChange={handleChange}
                          className={cn(
                            'flex w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
                            errorInputClass(`filter.${type}.only`),
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={errorLabelClass(`filter.${type}.ignore`)}>Ignore</label>
                        <textarea
                          name={`filter.${type}.ignore`}
                          placeholder="Ignore"
                          rows={3}
                          value={
                            serverState.filter?.[type]?.ignore
                              ? serverState.filter[type].ignore.join('\n')
                              : ''
                          }
                          onChange={handleChange}
                          className={cn(
                            'flex w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
                            errorInputClass(`filter.${type}.ignore`),
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-wrap">
          <Button
            variant="default"
            onClick={handleTestConnectionClick}
            disabled={!serverState.client || testConnection.connecting}
          >
            {testConnection.connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plug className="h-4 w-4" />
            )}
            Test
          </Button>
          {!isNew && (
            <Button
              variant="outline"
              onClick={handleDuplicateClick}
              disabled={testConnection.connecting}
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </Button>
          )}
          <Button variant="outline" onClick={onCancelClick} disabled={testConnection.connecting}>
            Cancel
          </Button>
          <Button variant="positive" onClick={handleSaveClick} disabled={testConnection.connecting}>
            Save
          </Button>
          {!isNew && (
            <Button
              variant="destructive"
              onClick={onRemoveOpenClick}
              disabled={testConnection.connecting}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
        </DialogFooter>

        {confirmingRemove && (
          <ConfirmModal
            title={`Delete ${serverState.name}`}
            message="Are you sure you want to remove this server connection?"
            onCancelClick={onRemoveCancelClick}
            onRemoveClick={onRemoveConfirmClick}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

ServerModalForm.displayName = 'ServerModalForm';
export default ServerModalForm;
