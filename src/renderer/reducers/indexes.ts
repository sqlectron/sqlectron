import { Action, AnyAction, Reducer } from 'redux';

import * as connTypes from '../actions/connections';
import * as dbTypes from '../actions/databases';
import * as types from '../actions/indexes';

export interface Index {
  name: string;
}

export interface IndexesByTable {
  [table: string]: Index[];
}

export interface IndexAction extends Action {
  type: string;
  error: Error;
  isServerConnection: boolean;
  database: string;
  table: string;
  indexes: Array<Index>;
}

export interface IndexState {
  isFetching: boolean;
  didInvalidate: boolean;
  indexesByTable: {
    [database: string]: IndexesByTable;
  };
  error: null | Error;
}

const INITIAL_STATE: IndexState = {
  isFetching: false,
  didInvalidate: false,
  indexesByTable: {},
  error: null,
};

const indexReducer: Reducer<IndexState, AnyAction> = function (
  state: IndexState = INITIAL_STATE,
  action,
): IndexState {
  switch (action.type) {
    case connTypes.CONNECTION_REQUEST: {
      return action.isServerConnection ? { ...INITIAL_STATE, didInvalidate: true } : state;
    }
    case types.FETCH_INDEXES_REQUEST: {
      return {
        ...state,
        isFetching: true,
        didInvalidate: false,
        error: null,
      };
    }
    case types.FETCH_INDEXES_SUCCESS: {
      return {
        ...state,
        isFetching: false,
        didInvalidate: false,
        indexesByTable: {
          ...state.indexesByTable,
          [action.database]: {
            ...state.indexesByTable[action.database],
            [action.table]: action.indexes.map((name) => ({ name })),
          },
        },
        error: null,
      };
    }
    case types.FETCH_INDEXES_FAILURE: {
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

export default indexReducer;
