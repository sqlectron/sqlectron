import { cloneDeep } from 'lodash';
import { AnyAction } from 'redux';

import { Server } from '../../common/types/server';
import { sqlectron, DB_CLIENTS } from '../api';
import { ApplicationState, ThunkResult } from '../reducers';

export const CLOSE_CONNECTION = 'CLOSE_CONNECTION';
export const CONNECTION_REQUEST = 'CONNECTION_REQUEST';
export const CONNECTION_SUCCESS = 'CONNECTION_SUCCESS';
export const CONNECTION_FAILURE = 'CONNECTION_FAILURE';
export const CONNECTION_REQUIRE_SSH_PASSPHRASE = 'CONNECTION_REQUIRE_SSH_PASSPHRASE';
export const CONNECTION_SET_CONNECTING = 'CONNECTION_SET_CONNECTING';
export const TEST_CONNECTION_REQUEST = 'TEST_CONNECTION_REQUEST';
export const TEST_CONNECTION_SUCCESS = 'TEST_CONNECTION_SUCCESS';
export const TEST_CONNECTION_FAILURE = 'TEST_CONNECTION_FAILURE';

let isConnected = false;

export function getDatabaseByQueryID(state: ApplicationState): string {
  if (!isConnected) {
    throw new Error('There is no server available');
  }

  const currentQuery = state.queries.queriesById[state.queries.currentQueryId as number];

  return currentQuery ? currentQuery.database : '';
}

export function setConnecting(): ThunkResult<void> {
  return (dispatch) => {
    dispatch({ type: CONNECTION_SET_CONNECTING });
  };
}

export function connect(
  id: string,
  databaseName?: string,
  reconnecting = false,
  sshPassphrase?: string,
): ThunkResult<void> {
  return async (dispatch, getState) => {
    let server;
    let database;
    let defaultDatabase;
    const wasAlreadyConnected = isConnected;

    try {
      if (reconnecting) {
        dispatch({ type: CONNECTION_SET_CONNECTING });
        await sqlectron.db.disconnectServer();
        isConnected = false;
      }

      const config = getState().config.data;
      const cryptoSecret = config?.crypto?.secret;

      const servers = await sqlectron.servers.getAll();
      server = servers.find((srv) => srv.id === id);
      if (!server) {
        throw new Error('Server configuration not found');
      }

      server = await sqlectron.servers.decryptSecrects(server, cryptoSecret as string);

      defaultDatabase = DB_CLIENTS.find((c) => c.key === server.client)?.defaultDatabase as string;
      database = databaseName || server.database || defaultDatabase;

      dispatch({
        type: CONNECTION_REQUEST,
        server,
        database,
        reconnecting,
        isServerConnection: !databaseName,
      });

      const clonedServer = cloneDeep(server);

      if (!isConnected) {
        if (clonedServer.ssh) {
          if (clonedServer.ssh.privateKeyWithPassphrase && typeof sshPassphrase === 'undefined') {
            dispatch({ type: CONNECTION_REQUIRE_SSH_PASSPHRASE });
            return;
          }

          if (clonedServer.ssh.privateKeyWithPassphrase) {
            clonedServer.ssh.passphrase = sshPassphrase;
          }
        }
      }

      await sqlectron.db.connect(clonedServer, database);
      isConnected = true;

      dispatch({
        type: CONNECTION_SUCCESS,
        clonedServer,
        database,
        config,
        // If the server was already connected and no explicit database was requested,
        // this is a re-mount (e.g., HMR) — treat as reconnect to avoid spurious new query tabs.
        reconnecting: reconnecting || (wasAlreadyConnected && !databaseName),
      });
    } catch (error) {
      dispatch({
        type: CONNECTION_FAILURE,
        server,
        database,
        error,
      });

      const currentConn = getState().connections;
      if (!currentConn.databases.length) {
        isConnected = false;
      }
    }
  };
}

export function disconnect(): AnyAction {
  if (isConnected) {
    sqlectron.db.disconnectServer();
  }

  isConnected = false;

  return { type: CLOSE_CONNECTION };
}

export function reconnect(id: string, database: string): ThunkResult<void> {
  return connect(id, database, true);
}

export function test(server: Server): ThunkResult<void> {
  return async (dispatch) => {
    const serverCopy = JSON.parse(JSON.stringify(server));
    if (!serverCopy.database) {
      const defaultDatabase = DB_CLIENTS.find((c) => c.key === serverCopy.client)?.defaultDatabase;
      serverCopy.database = serverCopy.database || defaultDatabase;
    }

    dispatch({ type: TEST_CONNECTION_REQUEST, serverCopy });
    let dbClient;
    try {
      await sqlectron.db.connect(serverCopy, serverCopy.database);
      dispatch({ type: TEST_CONNECTION_SUCCESS, serverCopy });
    } catch (error) {
      dispatch({ type: TEST_CONNECTION_FAILURE, serverCopy, error });
    } finally {
      if (dbClient) {
        dbClient.disconnect();
      }
    }
  };
}
