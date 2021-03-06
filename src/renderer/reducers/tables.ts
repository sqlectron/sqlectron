import { Action, Reducer } from 'redux';
import * as connTypes from '../actions/connections';
import * as dbTypes from '../actions/databases';
import * as queryTypes from '../actions/queries';
import * as types from '../actions/tables';

export interface TableAction extends Action {
  type: string;
  error: Error;
  isServerConnection: boolean;
  tables: Array<string>;
  database: string;
  results: Array<{ command: string }>;
}

export interface TableState {
  error: null | Error;
  isFetching: boolean;
  didInvalidate: boolean;
  itemsByDatabase: {
    [database: string]: string;
  };
  selectedTablesForDiagram: Array<string>;
}

const INITIAL_STATE: TableState = {
  error: null,
  isFetching: false,
  didInvalidate: false,
  itemsByDatabase: {},
  selectedTablesForDiagram: [],
};

const COMMANDS_TRIGER_REFRESH = ['CREATE_TABLE', 'DROP_TABLE'];

const tableReducer: Reducer<TableState> = function (
  state: TableState = INITIAL_STATE,
  action,
): TableState {
  switch (action.type) {
    case connTypes.CONNECTION_REQUEST: {
      return action.isServerConnection ? { ...INITIAL_STATE, didInvalidate: true } : state;
    }
    case types.SELECT_TABLES_FOR_DIAGRAM: {
      return {
        ...state,
        selectedTablesForDiagram: action.tables,
      };
    }
    case types.FETCH_TABLES_REQUEST: {
      return {
        ...state,
        isFetching: true,
        didInvalidate: false,
        error: null,
      };
    }
    case types.FETCH_TABLES_SUCCESS: {
      return {
        ...state,
        isFetching: false,
        didInvalidate: false,
        itemsByDatabase: {
          ...state.itemsByDatabase,
          [action.database]: action.tables,
        },
        error: null,
      };
    }
    case types.FETCH_TABLES_FAILURE: {
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
    case dbTypes.CLOSE_DATABASE_DIAGRAM: {
      return {
        ...state,
        selectedTablesForDiagram: [],
      };
    }
    default:
      return state;
  }
};

export default tableReducer;
