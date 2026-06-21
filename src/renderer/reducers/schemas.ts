import { Action, AnyAction, Reducer } from 'redux';

import * as connTypes from '../actions/connections';
import * as dbTypes from '../actions/databases';
import * as queryTypes from '../actions/queries';
import * as types from '../actions/schemas';

export interface Schema {
  name: string;
}

export interface SchemaAction extends Action {
  type: string;
  error: Error;
  schemas: Array<Schema>;
  isServerConnection: boolean;
  database: string;
  results: Array<{ command: string }>;
}

export interface SchemaState {
  error: null | Error;
  isFetching: boolean;
  didInvalidate: boolean;
  itemsByDatabase: {
    [db: string]: Array<string>;
  };
}

const INITIAL_STATE: SchemaState = {
  error: null,
  isFetching: false,
  didInvalidate: false,
  itemsByDatabase: {},
};

const COMMANDS_TRIGER_REFRESH = ['CREATE_SCHEMA', 'DROP_SCHEMA'];

const schemaReducer: Reducer<SchemaState, AnyAction> = function (
  state: SchemaState = INITIAL_STATE,
  action,
): SchemaState {
  switch (action.type) {
    case connTypes.CONNECTION_REQUEST: {
      return action.isServerConnection ? { ...INITIAL_STATE, didInvalidate: true } : state;
    }
    case types.FETCH_SCHEMAS_REQUEST: {
      return {
        ...state,
        isFetching: true,
        didInvalidate: false,
        error: null,
      };
    }
    case types.FETCH_SCHEMAS_SUCCESS: {
      return {
        ...state,
        isFetching: false,
        didInvalidate: false,
        itemsByDatabase: {
          ...state.itemsByDatabase,
          [action.database]: action.schemas.map((name) => ({ name })),
        },
        error: null,
      };
    }
    case types.FETCH_SCHEMAS_FAILURE: {
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
    case dbTypes.REFRESH_DATABASES: {
      return {
        ...state,
        didInvalidate: true,
      };
    }
    default:
      return state;
  }
};
export default schemaReducer;
