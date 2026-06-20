import { Action, Reducer } from 'redux';

import * as connTypes from '../actions/connections';
import * as types from '../actions/databases';
import * as queryTypes from '../actions/queries';

export interface Database {
  name: string;
}

export interface DatabaseAction extends Action {
  error: Error;
  type: string;
  isServerConnection: boolean;
  databases: Array<Database>;
  name: string;
  results: Array<{ command: string }>;
}

export interface DatabaseState {
  error: Error | null;
  isFetching: boolean;
  didInvalidate: boolean;
  items: Array<Database>;
}

const INITIAL_STATE: DatabaseState = {
  error: null,
  isFetching: false,
  didInvalidate: false,
  items: [],
};

const COMMANDS_TRIGER_REFRESH = ['CREATE_DATABASE', 'DROP_DATABASE'];

const databaseReducer: Reducer<DatabaseState> = function (
  state: DatabaseState = INITIAL_STATE,
  action,
): DatabaseState {
  switch (action.type) {
    case connTypes.CONNECTION_REQUEST: {
      return action.isServerConnection ? { ...INITIAL_STATE, didInvalidate: true } : state;
    }
    case types.FETCH_DATABASES_REQUEST: {
      return {
        ...state,
        isFetching: true,
        didInvalidate: false,
        error: null,
      };
    }
    case types.FETCH_DATABASES_SUCCESS: {
      return {
        ...state,
        isFetching: false,
        didInvalidate: false,
        items: action.databases.map((name) => ({ name })),
        error: null,
      };
    }
    case types.FETCH_DATABASES_FAILURE: {
      return {
        ...state,
        isFetching: false,
        didInvalidate: true,
        error: action.error,
      };
    }
    case queryTypes.EXECUTE_QUERY_SUCCESS: {
      return {
        ...state,
        didInvalidate: action.results.some(({ command }) =>
          COMMANDS_TRIGER_REFRESH.includes(command),
        ),
      };
    }
    default:
      return state;
  }
};

export default databaseReducer;
