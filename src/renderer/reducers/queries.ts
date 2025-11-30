import { Action, Reducer, AnyAction } from 'redux';
import { ConnectionAction } from './connections';
import * as connTypes from '../actions/connections';
import * as types from '../actions/queries';

interface QueryPartialUpdate {
  name?: string;
  filename?: null | string;
  isExecuting?: boolean;
  isDefaultSelect?: boolean;
  didInvalidate?: boolean;
  query?: string;
  selectedQuery?: string;
  queryHistory?: Array<string>;
  results?: null | [];
  error?: null | Error;
  copied?: null | boolean;
  isCanceling?: boolean;
}

export interface Query {
  id: number;
  database: string;
  name: string;
  filename: null | string;
  isExecuting: boolean;
  isDefaultSelect: boolean;
  didInvalidate: boolean;
  query: string;
  selectedQuery: string;
  queryHistory: Array<string>;
  results:
    | null
    | {
        command: string;
        fields: any[];
        rows: any[];
        rowCount: number | undefined;
        affectedRows: number | undefined;
      }[];
  error: null | Error;
  copied: null | boolean;
  saved: null | boolean;
  isCanceling: boolean;
  resultItemsPerPage: number;
}

export interface QueryAction extends Action {
  error: Error;
  type: string;
  id: number;
  isDefaultSelect: boolean;
  query: string;
  name: string;
  filename: string;
  selectedQuery: string;
  database: string;
  table: string;
  results: string;
}

export interface QueryState {
  lastCreatedId: number;
  currentQueryId: null | number;
  queryIds: Array<number>;
  queriesById: {
    [queryId: number]: Query;
  };
  resultItemsPerPage: number;
  enabledAutoComplete: boolean;
  enabledLiveAutoComplete: boolean;
}

const INITIAL_STATE: QueryState = {
  lastCreatedId: 0,
  currentQueryId: null,
  queryIds: [],
  queriesById: {},
  resultItemsPerPage: 100,
  enabledAutoComplete: true,
  enabledLiveAutoComplete: true,
};

const queryReducer: Reducer<QueryState> = function (
  state: QueryState = INITIAL_STATE,
  action: AnyAction,
): QueryState {
  switch (action.type) {
    case connTypes.CLOSE_CONNECTION: {
      return INITIAL_STATE;
    }
    case connTypes.CONNECTION_SUCCESS: {
      return addNewQuery(state, null, action as ConnectionAction);
    }
    case types.NEW_QUERY: {
      return addNewQuery(state, action as QueryAction);
    }
    case types.SELECT_QUERY: {
      return {
        ...state,
        currentQueryId: action.id,
      };
    }
    case types.REMOVE_QUERY: {
      const newState = { ...state };

      const currentQueryId = state.currentQueryId as number;

      const { database } = state.queriesById[currentQueryId];
      const index = state.queryIds.indexOf(currentQueryId);

      if (state.queryIds.length === 1) {
        newState.currentQueryId = null;
      } else if (index > 0) {
        newState.currentQueryId = state.queryIds[index - 1];
      } else {
        newState.currentQueryId = state.queryIds[index + 1];
      }

      newState.queryIds = [
        ...newState.queryIds.slice(0, index),
        ...newState.queryIds.slice(index + 1),
      ];
      newState.queriesById = Object.fromEntries(
        Object.entries(newState.queriesById).filter(([id]) => Number(id) !== currentQueryId),
      );

      if (newState.queryIds.length >= 1) {
        return newState;
      }

      return addNewQuery(newState, { ...action, database } as QueryAction);
    }
    case types.EXECUTE_QUERY_REQUEST: {
      return changeStateByCurrentQuery(state, {
        copied: false,
        isExecuting: true,
        isDefaultSelect: action.isDefaultSelect,
        didInvalidate: false,
        queryHistory: [
          ...state.queriesById[state.currentQueryId as number].queryHistory,
          action.query,
        ],
      });
    }
    case types.EXECUTE_QUERY_SUCCESS: {
      return changeStateByCurrentQuery(state, {
        error: null,
        isExecuting: false,
        results: action.results,
      });
    }
    case types.EXECUTE_QUERY_FAILURE: {
      return changeStateByCurrentQuery(state, {
        results: null,
        isExecuting: false,
        error: action.error,
      });
    }
    case types.CANCEL_QUERY_REQUEST: {
      return changeStateByCurrentQuery(state, {
        isCanceling: true,
      });
    }
    case types.CANCEL_QUERY_SUCCESS: {
      return changeStateByCurrentQuery(state, {
        error: null,
        isCanceling: false,
      });
    }
    case types.CANCEL_QUERY_FAILURE: {
      return changeStateByCurrentQuery(state, {
        results: null,
        isExecuting: false,
        isCanceling: false,
        error: action.error,
      });
    }
    case types.UPDATE_QUERY: {
      return changeStateByCurrentQuery(
        state,
        {
          query: action.query,
          selectedQuery: action.selectedQuery,
          copied: false,
        },
        { table: action.table },
      );
    }
    case types.COPY_QUERY_RESULT_TO_CLIPBOARD_REQUEST: {
      return changeStateByCurrentQuery(state, {
        error: null,
        copied: false,
      });
    }
    case types.COPY_QUERY_RESULT_TO_CLIPBOARD_SUCCESS: {
      return changeStateByCurrentQuery(state, {
        copied: true,
      });
    }
    case types.COPY_QUERY_RESULT_TO_CLIPBOARD_FAILURE: {
      return changeStateByCurrentQuery(state, {
        error: action.error,
        copied: false,
      });
    }
    case types.RENAME_QUERY: {
      if (!action.name.length) {
        return state;
      }

      return changeStateByCurrentQuery(state, {
        name: action.name,
      });
    }
    case types.SAVE_QUERY_SUCCESS: {
      return changeStateByCurrentQuery(state, {
        name: action.name,
        filename: action.filename,
      });
    }
    case types.OPEN_QUERY_SUCCESS: {
      return changeStateByCurrentQuery(state, {
        name: action.name,
        query: action.query,
        filename: action.filename,
      });
    }
    case types.OPEN_QUERY_FAILURE:
    case types.SAVE_QUERY_FAILURE: {
      return changeStateByCurrentQuery(state, {
        error: action.error,
      });
    }
    default:
      return state;
  }
};

function addNewQuery(
  state: QueryState,
  queryAction: QueryAction | null,
  connAction?: ConnectionAction,
): QueryState {
  let { enabledAutoComplete, enabledLiveAutoComplete, resultItemsPerPage } = INITIAL_STATE;

  if (connAction) {
    if (connAction.reconnecting) {
      return state;
    }

    if (connAction.config) {
      if (connAction.config.enabledAutoComplete !== undefined) {
        enabledAutoComplete = connAction.config.enabledAutoComplete;
      }

      if (connAction.config.enabledLiveAutoComplete !== undefined) {
        enabledLiveAutoComplete = connAction.config.enabledLiveAutoComplete;
      }
    }
  }

  if (state.resultItemsPerPage !== undefined) {
    resultItemsPerPage = state.resultItemsPerPage;
  }

  const database = (queryAction?.database || connAction?.database) as string;

  const newId = state.lastCreatedId + 1;
  const newQuery: Query = {
    id: newId,
    database,
    name: createQueryName(newId, database, queryAction?.table),
    filename: null,
    isExecuting: false,
    isDefaultSelect: false,
    didInvalidate: true,
    query: '',
    selectedQuery: '',
    queryHistory: [],
    results: null,
    error: null,
    copied: null,
    saved: null,
    isCanceling: false,
    resultItemsPerPage,
  };

  return {
    ...state,
    lastCreatedId: newQuery.id,
    currentQueryId: newQuery.id,
    resultItemsPerPage,
    enabledAutoComplete,
    enabledLiveAutoComplete,
    queryIds: [...state.queryIds, newQuery.id],
    queriesById: {
      ...state.queriesById,
      [newQuery.id]: newQuery,
    },
  };
}

function changeStateByCurrentQuery(
  oldFullState: QueryState,
  newCurrentQueryState: QueryPartialUpdate,
  options: { table?: string } = {},
) {
  const currentQueryId = oldFullState.currentQueryId as number;
  const oldQueryState = oldFullState.queriesById[currentQueryId];

  oldQueryState.name = newCurrentQueryState.name || oldQueryState.name;
  if (options.table) {
    oldQueryState.name = createQueryName(currentQueryId, oldQueryState.database, options.table);
  }

  return {
    ...oldFullState,
    queriesById: {
      ...oldFullState.queriesById,
      [currentQueryId]: {
        ...oldQueryState,
        ...newCurrentQueryState,
      },
    },
  };
}

function createQueryName(id: number, database: string, table?: string): string {
  return table ? `${database} / ${table} #${id}` : `${database} #${id}`;
}

export default queryReducer;
