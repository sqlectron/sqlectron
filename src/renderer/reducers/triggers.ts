import { Action, Reducer } from 'redux';

import * as connTypes from '../actions/connections';
import * as dbTypes from '../actions/databases';
import * as types from '../actions/triggers';

export interface Trigger {
  name: string;
}

export interface TriggersByTable {
  [table: string]: Trigger[];
}

export interface TriggerAction extends Action {
  type: string;
  error: Error;
  isServerConnection: boolean;
  database: string;
  table: string;
  triggers: Array<Trigger>;
}

export interface TriggerState {
  error: null | Error;
  isFetching: boolean;
  didInvalidate: boolean;
  triggersByTable: {
    [database: string]: TriggersByTable;
  };
}

const INITIAL_STATE: TriggerState = {
  error: null,
  isFetching: false,
  didInvalidate: false,
  triggersByTable: {},
};

const triggerReducer: Reducer<TriggerState> = function (
  state: TriggerState = INITIAL_STATE,
  action,
): TriggerState {
  switch (action.type) {
    case connTypes.CONNECTION_REQUEST: {
      return action.isServerConnection ? { ...INITIAL_STATE, didInvalidate: true } : state;
    }
    case types.FETCH_TRIGGERS_REQUEST: {
      return {
        ...state,
        isFetching: true,
        didInvalidate: false,
        error: null,
      };
    }
    case types.FETCH_TRIGGERS_SUCCESS: {
      return {
        ...state,
        isFetching: false,
        didInvalidate: false,
        triggersByTable: {
          ...state.triggersByTable,
          [action.database]: {
            ...state.triggersByTable[action.database],
            [action.table]: action.triggers.map((name) => ({ name })),
          },
        },
        error: null,
      };
    }
    case types.FETCH_TRIGGERS_FAILURE: {
      return {
        ...state,
        isFetching: false,
        didInvalidate: true,
        error: action.error,
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

export default triggerReducer;
