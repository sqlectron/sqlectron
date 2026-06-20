import { Action, Reducer } from 'redux';

import { Config as ConfigType } from '../../common/types/config';
import { Server } from '../../common/types/server';
import * as types from '../actions/connections';
import * as serverTypes from '../actions/servers';
import { DB_CLIENTS } from '../api';

export interface ConnectionAction extends Action {
  type: string;
  error: Error;
  server: Server;
  database: string;
  reconnecting: boolean;
  config?: ConfigType;
}

export interface ConnectionState {
  error: null | Error;
  connected: boolean;
  connecting: boolean;
  server: null | Server;
  disabledFeatures: null | Array<string>;
  waitingPrivateKeyPassphrase: boolean;
  databases: Array<string>;

  // testing connection props
  testConnected: boolean;
  testConnecting: boolean;
  testServer: null | Server;
  testError: Error | null;
}

const INITIAL_STATE: ConnectionState = {
  error: null,
  connected: false,
  connecting: false,
  server: null,
  disabledFeatures: null,
  waitingPrivateKeyPassphrase: false,
  databases: [], // connected databases

  // testing connection props
  testConnected: false,
  testConnecting: false,
  testServer: null,
  testError: null,
};

const connectionReducer: Reducer<ConnectionState> = function (
  state: ConnectionState = INITIAL_STATE,
  action,
): ConnectionState {
  switch (action.type) {
    case types.CONNECTION_SET_CONNECTING: {
      return {
        ...INITIAL_STATE,
        connecting: true,
      };
    }
    case types.CONNECTION_REQUEST: {
      const dbClient = DB_CLIENTS.find((dbClient) => dbClient.key === action.server.client);
      return {
        ...state,
        server: action.server,
        disabledFeatures: dbClient?.disabledFeatures || [],
        connected: false,
        connecting: true,
      };
    }
    case types.CONNECTION_REQUIRE_SSH_PASSPHRASE: {
      return { ...state, waitingPrivateKeyPassphrase: true };
    }
    case types.CONNECTION_SUCCESS: {
      return {
        ...state,
        connected: true,
        connecting: false,
        waitingPrivateKeyPassphrase: false,
        databases: [...state.databases, action.database],
      };
    }
    case types.CONNECTION_FAILURE: {
      return {
        ...state,
        connected: false,
        connecting: false,
        waitingPrivateKeyPassphrase: false,
        error: action.error,
      };
    }
    case types.TEST_CONNECTION_REQUEST: {
      const { server } = action;
      return {
        ...INITIAL_STATE,
        testConnected: false,
        testConnecting: true,
        testServer: server,
      };
    }
    case types.TEST_CONNECTION_SUCCESS: {
      if (!isSameTestConnection(state, action)) return state;
      return { ...state, testConnected: true, testConnecting: false };
    }
    case types.TEST_CONNECTION_FAILURE: {
      if (!isSameTestConnection(state, action)) return state;
      return {
        ...state,
        testConnected: false,
        testConnecting: false,
        testError: action.error,
      };
    }
    case types.CLOSE_CONNECTION:
    case serverTypes.START_EDITING_SERVER:
    case serverTypes.FINISH_EDITING_SERVER: {
      return INITIAL_STATE;
    }

    default:
      return state;
  }
};

function isSameTestConnection(state, action) {
  return state.testServer === action.server;
}

export default connectionReducer;
