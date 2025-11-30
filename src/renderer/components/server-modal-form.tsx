import React, {
  ChangeEvent,
  FC,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cloneDeep, set } from 'lodash';
import Select from 'react-select';
import { DB_CLIENTS } from '../api';
import ConfirmModal from './confim-modal';
import Message from './message';
import Checkbox from './checkbox';
import { requireClientLogo } from './require-context';
import { ConnectionString } from 'connection-string';
import { Server } from '../../common/types/server';
import { ValidationError } from '../reducers/servers';
import { useAppSelector } from '../hooks/redux';
import { titlize } from '../../common/utils/string';

const CLIENTS = DB_CLIENTS.map((dbClient) => ({
  value: dbClient.key,
  logo: requireClientLogo(dbClient.key),
  label: dbClient.name,
  defaultPort: dbClient.defaultPort,
  disabledFeatures: dbClient.disabledFeatures,
}));

const DEFAULT_SSH_PORT = 22;

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
    host: state.host && state.host.length ? state.host : null,
    port: state.port || state.defaultPort,
    socketPath: state.socketPath && state.socketPath.length ? state.socketPath : null,
    user: state.user || null,
    password: state.password || null,
    database: state.database,
    domain: state.domain,
    schema: state.schema || null,
  } as Server;

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
    <div>
      <img alt="logo" src={logo} style={{ width: '16px' }} /> {label}
    </div>
  );
};

type FormServer = Partial<Server> & { defaultPort?: number };
type FormSSH = Partial<Server['ssh']>;

interface Props {
  onSaveClick: (server: Server) => void;
  onCancelClick: () => void;
  onRemoveClick: () => void;
  onTestConnectionClick: (server: Server) => void;
  onDuplicateClick: (server: Server) => void;
  server: Partial<Server>;
  error: ValidationError | null;
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

  const modalRef = useRef<HTMLDivElement>(null);

  const isNew = !server.id;

  useEffect(() => {
    if (!modalRef.current) {
      return;
    }
    const elem = modalRef.current;

    $(elem)
      .modal({
        closable: true,
        detachable: false,
        allowMultiple: true,
        observeChanges: true,
        onHidden: () => {
          onCancelClick();
          return true;
        },
        onDeny: () => {
          onCancelClick();
        },
        onApprove: (): false => false,
      })
      .modal('show');
    return () => {
      $(elem).modal('hide');
    };
  }, [modalRef, onCancelClick]);

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
      let hasError = !!(error && error[name]);
      // I'm not sure what this is supposed to be?
      // @ts-ignore
      if (error && error.ssh && /^ssh\./.test(name)) {
        // @ts-ignore
        const sshErrors = error.ssh[0].errors[0];
        const lastName = name.replace(/^ssh\./, '');
        hasError = !!~Object.keys(sshErrors).indexOf(lastName);
      }
      return hasError ? 'error' : '';
    },
    [error],
  );

  const isSSHChecked = !!serverState.ssh;
  const ssh: FormSSH = serverState.ssh || {};

  const classStatusButtons = testConnection.connecting ? 'disabled' : '';
  const classStatusTestButton = [
    serverState.client ? '' : 'disabled',
    testConnection.connecting ? 'loading' : '',
  ].join(' ');

  return (
    <div id="server-modal" className="ui modal" ref={modalRef}>
      <div className="header">Server Information</div>
      <div className="content">
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
        <form className="ui form">
          <div>
            <div className="fields">
              <div className={`nine wide field ${highlightError('name')}`}>
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={serverState.name || ''}
                  onChange={handleChange}
                />
              </div>
              <div className={`six wide field ${highlightError('client')}`}>
                <label>Database Type</label>
                <Select
                  name="client"
                  placeholder="Select"
                  styles={
                    highlightError('client')
                      ? {
                          control: (styles) => ({
                            ...styles,
                            backgroundColor: '#fff6f6',
                            borderColor: '#e0b4b4',
                            color: '#9f3a38',
                          }),
                        }
                      : {}
                  }
                  formatOptionLabel={renderClientItem}
                  options={CLIENTS}
                  isClearable={false}
                  onChange={handleOnClientChange}
                  value={CLIENTS.find((c) => c.value === serverState.client)}
                />
              </div>
              <div className="one field" style={{ paddingTop: '2em' }}>
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
            <div className="field">
              <label>Server Address</label>
              <div className="fields">
                <div className={`five wide field ${highlightError('host')}`}>
                  <input
                    type="text"
                    name="host"
                    placeholder="Host"
                    value={serverState.host || ''}
                    onChange={handleChange}
                    disabled={isFeatureDisabled('server:host') || !!serverState.socketPath}
                  />
                </div>
                <div className={`two wide field ${highlightError('port')}`}>
                  <input
                    type="number"
                    name="port"
                    maxLength={5}
                    placeholder="Port"
                    value={serverState.port || serverState.defaultPort || ''}
                    onChange={handleChange}
                    disabled={isFeatureDisabled('server:port') || !!serverState.socketPath}
                  />
                </div>
                <div className={`four wide field ${highlightError('domain')}`}>
                  <input
                    type="text"
                    name="domain"
                    placeholder="Domain"
                    value={serverState.domain || ''}
                    disabled={isFeatureDisabled('server:domain')}
                    onChange={handleChange}
                  />
                </div>
                <div className={`five wide field ${highlightError('socketPath')}`}>
                  <div className="ui action input">
                    <input
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
                    />
                    <label htmlFor="file.socketPath" className="ui icon button btn-file">
                      <i className="file outline icon" />
                      <input
                        type="file"
                        id="file.socketPath"
                        name="file.socketPath"
                        onChange={handleChange}
                        style={{ display: 'none' }}
                        disabled={
                          !!serverState.host ||
                          !!serverState.port ||
                          isFeatureDisabled('server:socketPath')
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="fields">
              <div className={`four wide field ${highlightError('user')}`}>
                <label>User</label>
                <input
                  type="text"
                  name="user"
                  placeholder="User"
                  value={serverState.user || ''}
                  disabled={isFeatureDisabled('server:user')}
                  onChange={handleChange}
                />
              </div>
              <div className={`four wide field ${highlightError('password')}`}>
                <div>
                  <label>Password</label>
                </div>
                <div className="ui action input">
                  <input
                    type={showPlainPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={(serverState.password as string) || ''}
                    disabled={isFeatureDisabled('server:password')}
                    onChange={handleChange}
                  />
                  <span className="ui icon button" onClick={onToggleShowPlainPasswordClick}>
                    <i className={`icon ${showPlainPassword ? 'hide' : 'unhide'}`} />
                  </span>
                </div>
              </div>
              <div className={`four wide field ${highlightError('database')}`}>
                <label>Initial Database/Keyspace</label>
                <div className={serverState.client === 'sqlite' ? 'ui action input' : ''}>
                  <input
                    type="text"
                    name="database"
                    placeholder="Database"
                    value={serverState.database || ''}
                    onChange={handleChange}
                  />
                  {serverState.client === 'sqlite' && (
                    <label htmlFor="file.database" className="ui icon button btn-file">
                      <i className="file outline icon" />
                      <input
                        type="file"
                        id="file.database"
                        name="file.database"
                        onChange={handleChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className={`four wide field ${highlightError('schema')}`}>
                <label>Initial Schema</label>
                <input
                  type="text"
                  name="schema"
                  maxLength={100}
                  placeholder="Schema"
                  disabled={isFeatureDisabled('server:schema')}
                  value={serverState.schema || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="field">
              <div className={`field ${highlightError('name')}`}>
                <label>URI</label>
                <input
                  type="text"
                  name="connURI"
                  placeholder="URI"
                  disabled={!showPlainPassword}
                  value={connURI || ''}
                  onChange={handleURIChange}
                />
                <em style={{ visibility: showPlainPassword ? 'hidden' : 'visible' }}>
                  Make the password visible in order to change the database credentials through the
                  URI format.
                </em>
              </div>
            </div>
          </div>
          {!isFeatureDisabled('server:ssh') && (
            <div className="ui segment">
              <div className="one field">
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
              </div>
              {isSSHChecked && (
                <div>
                  <div className="field">
                    <label>SSH Address</label>
                    <div className="fields">
                      <div className={`six wide field ${highlightError('ssh.host')}`}>
                        <input
                          type="text"
                          name="ssh.host"
                          placeholder="Host"
                          disabled={!isSSHChecked}
                          value={ssh.host || ''}
                          onChange={handleChange}
                        />
                      </div>
                      <div className={`three wide field ${highlightError('ssh.port')}`}>
                        <input
                          type="number"
                          name="ssh.port"
                          maxLength={5}
                          placeholder="Port"
                          disabled={!isSSHChecked}
                          value={ssh.port || DEFAULT_SSH_PORT}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="four wide field" style={{ paddingTop: '0.5em' }}>
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
                  <div className="fields">
                    <div className={`four wide field ${highlightError('ssh.user')}`}>
                      <label>User</label>
                      <input
                        type="text"
                        name="ssh.user"
                        placeholder="User"
                        disabled={!isSSHChecked}
                        value={ssh.user || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={`four wide field ${highlightError('ssh.password')}`}>
                      <label>Password</label>
                      <input
                        type="password"
                        name="ssh.password"
                        placeholder="Password"
                        disabled={!isSSHChecked || !!ssh.privateKey || ssh.useAgent}
                        value={(ssh.password as string) || ''}
                        onChange={handleChange}
                      />
                    </div>
                    <div className={`five wide field ${highlightError('ssh.privateKey')}`}>
                      <label>Private Key</label>
                      <div className="ui action input">
                        <input
                          type="text"
                          name="ssh.privateKey"
                          placeholder="~/.ssh/id_rsa"
                          disabled={!isSSHChecked || !!ssh.password || ssh.useAgent}
                          value={ssh.privateKey || ''}
                          onChange={handleChange}
                        />
                        <label htmlFor="file.ssh.privateKey" className="ui icon button btn-file">
                          <i className="file outline icon" />
                          <input
                            type="file"
                            id="file.ssh.privateKey"
                            name="file.ssh.privateKey"
                            onChange={handleChange}
                            disabled={!isSSHChecked || !!ssh.password || ssh.useAgent}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="three wide field" style={{ paddingTop: '2em' }}>
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
          <div className="ui segment">
            <div className="one field">
              <Checkbox
                name="filter"
                label="Filter"
                checked={!!serverState.filter}
                onChecked={() => updateServerState({ filter: {} })}
                onUnchecked={() => updateServerState({ filter: undefined })}
              />
            </div>
            {!!serverState.filter && (
              <div>
                <p>
                  <em>
                    Allow to pre filter the data available in the sidebar. It improves the rendering
                    performance for large servers.
                    <br />
                    Separate values by break line
                  </em>
                </p>
                {['database', 'schema'].map((type) => (
                  <div key={type} className="field">
                    <label>{titlize(type)}</label>
                    <div className="fields">
                      <div className={`eight wide field ${highlightError(`filter.${type}.only`)}`}>
                        <label>Only</label>
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
                        />
                      </div>
                      <div
                        className={`eight wide field ${highlightError(`filter.${type}.ignore`)}`}>
                        <label>Ignore</label>
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
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
      <div className="actions">
        <div
          className={`small ui blue right labeled icon button ${classStatusTestButton}`}
          tabIndex={0}
          onClick={handleTestConnectionClick}>
          Test
          <i className="plug icon" />
        </div>
        {!isNew && (
          <div
            className={`small ui right labeled icon button ${classStatusButtons}`}
            tabIndex={0}
            onClick={handleDuplicateClick}>
            Duplicate
            <i className="copy icon" />
          </div>
        )}
        <div
          className={`small ui black deny right labeled icon button ${classStatusButtons}`}
          tabIndex={0}>
          Cancel
          <i className="ban icon" />
        </div>
        <div
          className={`small ui green right labeled icon button ${classStatusButtons}`}
          tabIndex={0}
          onClick={handleSaveClick}>
          Save
          <i className="checkmark icon" />
        </div>
        {!isNew && (
          <div
            className={`small ui red right labeled icon button ${classStatusButtons}`}
            tabIndex={0}
            onClick={onRemoveOpenClick}>
            Remove
            <i className="trash icon" />
          </div>
        )}
      </div>
      {confirmingRemove && (
        <ConfirmModal
          context="#server-modal"
          title={`Delete ${serverState.name}`}
          message="Are you sure you want to remove this server connection?"
          onCancelClick={onRemoveCancelClick}
          onRemoveClick={onRemoveConfirmClick}
        />
      )}
    </div>
  );
};

ServerModalForm.displayName = 'ServerModalForm';
export default ServerModalForm;
