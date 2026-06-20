import { Action, Reducer } from 'redux';

import * as types from '../actions/columns';
import * as connTypes from '../actions/connections';
import * as dbTypes from '../actions/databases';

export interface Column {
  name: string;
  dataType: string;
}

export interface ColumnsByTable {
  [table: string]: Column[];
}

export interface ColumnAction extends Action {
  type: string;
  error: Error;
  isServerConnection: boolean;
  database: string;
  table: string;
  columns: Array<{ columnName: string; dataType: string }>;
}

export interface ColumnState {
  error: null | Error;
  didInvalidate: boolean;
  isFetching: {
    [database: string]: {
      [table: string]: boolean;
    };
  };
  columnsByTable: {
    [database: string]: ColumnsByTable;
  };
}

const INITIAL_STATE: ColumnState = {
  error: null,
  isFetching: {},
  didInvalidate: false,
  columnsByTable: {},
};

const columnReducer: Reducer<ColumnState> = function (
  state: ColumnState = INITIAL_STATE,
  action,
): ColumnState {
  switch (action.type) {
    case connTypes.CONNECTION_REQUEST: {
      return action.isServerConnection ? { ...INITIAL_STATE, didInvalidate: true } : state;
    }
    case types.FETCH_COLUMNS_REQUEST: {
      return {
        ...state,
        isFetching: {
          ...state.isFetching,
          [action.database]: {
            ...state.isFetching[action.database],
            [action.table]: true,
          },
        },
        didInvalidate: false,
        error: null,
      };
    }
    case types.FETCH_COLUMNS_SUCCESS: {
      return {
        ...state,
        isFetching: {
          ...state.isFetching,
          [action.database]: {
            ...state.isFetching[action.database],
            [action.table]: false,
          },
        },
        didInvalidate: false,
        columnsByTable: {
          ...state.columnsByTable,
          [action.database]: {
            ...state.columnsByTable[action.database],
            [action.table]: action.columns.map((column) => ({
              name: column.columnName,
              dataType: column.dataType,
            })),
          },
        },
        error: null,
      };
    }
    case types.FETCH_COLUMNS_FAILURE: {
      return {
        ...state,
        isFetching: {
          ...state.isFetching,
          [action.database]: {
            ...state.isFetching[action.database],
            [action.table]: false,
          },
        },
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

export default columnReducer;
