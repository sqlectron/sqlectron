import trim from 'lodash/trim';
import { AnyAction } from 'redux';

import { sqlectron } from '../api';
import { ApplicationState, ThunkResult } from '../reducers';
import { Query } from '../reducers/queries';

import { getDatabaseByQueryID } from './connections';

export const NEW_QUERY = 'NEW_QUERY';
export const RENAME_QUERY = 'RENAME_QUERY';
export const SELECT_QUERY = 'SELECT_QUERY';
export const REMOVE_QUERY = 'REMOVE_QUERY';
export const EXECUTE_QUERY_REQUEST = 'EXECUTE_QUERY_REQUEST';
export const EXECUTE_QUERY_SUCCESS = 'EXECUTE_QUERY_SUCCESS';
export const EXECUTE_QUERY_FAILURE = 'EXECUTE_QUERY_FAILURE';
export const CANCEL_QUERY_REQUEST = 'CANCEL_QUERY_REQUEST';
export const CANCEL_QUERY_SUCCESS = 'CANCEL_QUERY_SUCCESS';
export const CANCEL_QUERY_FAILURE = 'CANCEL_QUERY_FAILURE';
export const COPY_QUERY_RESULT_TO_CLIPBOARD_REQUEST = 'COPY_QUERY_RESULT_TO_CLIPBOARD_REQUEST';
export const COPY_QUERY_RESULT_TO_CLIPBOARD_SUCCESS = 'COPY_QUERY_RESULT_TO_CLIPBOARD_SUCCESS';
export const COPY_QUERY_RESULT_TO_CLIPBOARD_FAILURE = 'COPY_QUERY_RESULT_TO_CLIPBOARD_FAILURE';
export const SAVE_QUERY_RESULT_TO_FILE_REQUEST = 'SAVE_QUERY_RESULT_TO_FILE_REQUEST';
export const SAVE_QUERY_RESULT_TO_FILE_SUCCESS = 'SAVE_QUERY_RESULT_TO_FILE_SUCCESS';
export const SAVE_QUERY_RESULT_TO_FILE_FAILURE = 'SAVE_QUERY_RESULT_TO_FILE_FAILURE';
export const SAVE_QUERY_REQUEST = 'SAVE_QUERY_REQUEST';
export const SAVE_QUERY_SUCCESS = 'SAVE_QUERY_SUCCESS';
export const SAVE_QUERY_FAILURE = 'SAVE_QUERY_FAILURE';
export const OPEN_QUERY_REQUEST = 'OPEN_QUERY_REQUEST';
export const OPEN_QUERY_SUCCESS = 'OPEN_QUERY_SUCCESS';
export const OPEN_QUERY_FAILURE = 'OPEN_QUERY_FAILURE';
export const UPDATE_QUERY = 'UPDATE_QUERY';

export function newQuery(database: string): AnyAction {
  return { type: NEW_QUERY, database };
}

export function renameQuery(name: string): AnyAction {
  return { type: RENAME_QUERY, name };
}

export function selectQuery(id: number): AnyAction {
  return { type: SELECT_QUERY, id };
}

export function removeQuery(id: number): AnyAction {
  return { type: REMOVE_QUERY, id };
}

export function executeQueryIfNeeded(query: string, queryId: number): ThunkResult<void> {
  return (dispatch, getState) => {
    if (shouldExecuteQuery(query, getState())) {
      dispatch(executeQuery(query, false, null, queryId));
    }
  };
}

export function executeDefaultSelectQueryIfNeeded(
  database: string,
  table: string,
  schema?: string,
): ThunkResult<void> {
  return async (dispatch, getState) => {
    const currentState = getState();
    const queryDefaultSelect = await sqlectron.db.getQuerySelectTop(database, table, schema);

    if (!shouldExecuteQuery(queryDefaultSelect, currentState)) {
      return;
    }

    if (needNewQuery(currentState, database, queryDefaultSelect)) {
      dispatch({ type: NEW_QUERY, database, table });
    }

    dispatch({ type: UPDATE_QUERY, query: queryDefaultSelect, table });
    dispatch(executeQuery(queryDefaultSelect, true, database));
  };
}

export function updateQueryIfNeeded(query: string, selectedQuery?: string): ThunkResult<void> {
  return (dispatch, getState) => {
    if (shouldUpdateQuery(query, selectedQuery, getState())) {
      dispatch(updateQuery(query, selectedQuery));
    }
  };
}

function updateQuery(query: string, selectedQuery?: string): AnyAction {
  return { type: UPDATE_QUERY, query, selectedQuery };
}

function shouldUpdateQuery(
  query: string,
  selectedQuery: undefined | string,
  state: ApplicationState,
): boolean {
  const currentQuery = getCurrentQuery(state);
  if (!currentQuery) return true;
  if (currentQuery.isExecuting) return false;
  if (
    query === currentQuery.query &&
    selectedQuery !== undefined &&
    selectedQuery === currentQuery.selectedQuery
  ) {
    return false;
  }

  return true;
}

export function appendQuery(query: string): ThunkResult<void> {
  return (dispatch, getState) => {
    const queryState = getCurrentQuery(getState());
    const currentQuery = queryState.query;
    const newLine = !currentQuery ? '' : '\n';
    const appendedQuery = `${currentQuery}${newLine}${query}`;
    if (!queryState.isExecuting) {
      dispatch(updateQuery(appendedQuery));
    }
  };
}

export function copyToClipboard(
  rows: any[],
  exportType: string,
  delimiter?: string,
): ThunkResult<void> {
  return async (dispatch) => {
    dispatch({ type: COPY_QUERY_RESULT_TO_CLIPBOARD_REQUEST });
    try {
      await sqlectron.db.exportQueryResultToClipboard(rows, exportType, delimiter);
      dispatch({ type: COPY_QUERY_RESULT_TO_CLIPBOARD_SUCCESS });
    } catch (error) {
      dispatch({ type: COPY_QUERY_RESULT_TO_CLIPBOARD_FAILURE, error });
    }
  };
}

export function saveToFile(rows: any[], exportType: string, delimiter?: string): ThunkResult<void> {
  return async (dispatch) => {
    dispatch({ type: SAVE_QUERY_RESULT_TO_FILE_REQUEST });
    try {
      await sqlectron.db.exportQueryResultToFile(rows, exportType, delimiter);
      dispatch({ type: SAVE_QUERY_RESULT_TO_FILE_SUCCESS });
    } catch (error) {
      dispatch({ type: SAVE_QUERY_RESULT_TO_FILE_FAILURE, error });
    }
  };
}

export function saveQuery(isSaveAs: boolean): ThunkResult<void> {
  return async (dispatch, getState) => {
    dispatch({ type: SAVE_QUERY_REQUEST });
    try {
      const currentQuery = getCurrentQuery(getState());
      const { name, filename } = await sqlectron.db.saveQuery(
        isSaveAs,
        currentQuery.filename,
        currentQuery.query,
      );

      dispatch({ type: SAVE_QUERY_SUCCESS, name, filename });
    } catch (error) {
      dispatch({ type: SAVE_QUERY_FAILURE, error });
    }
  };
}

export function openQuery(): ThunkResult<void> {
  return async (dispatch) => {
    dispatch({ type: OPEN_QUERY_REQUEST });
    try {
      const { name, filename, query } = await sqlectron.db.openQuery();

      dispatch({
        type: OPEN_QUERY_SUCCESS,
        name,
        query,
        filename,
      });
    } catch (error) {
      dispatch({ type: OPEN_QUERY_FAILURE, error });
    }
  };
}

function shouldExecuteQuery(query: string, state: ApplicationState): boolean {
  const currentQuery = getCurrentQuery(state);
  if (!currentQuery) return true;
  if (currentQuery.isExecuting) return false;
  return true;
}

function canCancelQuery(state: ApplicationState): boolean {
  return !state.connections.disabledFeatures?.includes('cancelQuery');
}

function executeQuery(
  query: string,
  isDefaultSelect = false,
  database: string | null,
  queryId?: number,
): ThunkResult<void> {
  return async (dispatch, getState) => {
    dispatch({ type: EXECUTE_QUERY_REQUEST, query, isDefaultSelect });
    try {
      const state = getState();
      const db = database || getDatabaseByQueryID(state);

      let results;
      if (canCancelQuery(state) && queryId) {
        await sqlectron.db.createCancellableQuery(db, queryId, query);
        results = await sqlectron.db.executeCancellableQuery(queryId);
      } else {
        results = await sqlectron.db.executeQuery(db, query);
      }

      dispatch({ type: EXECUTE_QUERY_SUCCESS, query, results });
    } catch (error) {
      dispatch({ type: EXECUTE_QUERY_FAILURE, query, error });
    }
  };
}

export function cancelQuery(queryId: number): ThunkResult<void> {
  return async (dispatch) => {
    dispatch({ type: CANCEL_QUERY_REQUEST, queryId });
    try {
      await sqlectron.db.cancelCancellableQuery(queryId);

      dispatch({ type: CANCEL_QUERY_SUCCESS, queryId });
    } catch (error) {
      dispatch({ type: CANCEL_QUERY_FAILURE, queryId, error });
    }
  };
}

function getCurrentQuery(state: ApplicationState): Query {
  return state.queries.queriesById[state.queries.currentQueryId as number];
}

function needNewQuery(
  currentState: ApplicationState,
  database: string,
  queryDefaultSelect: string,
): boolean {
  const currentQuery = getCurrentQuery(currentState);
  if (!currentQuery) {
    return false;
  }

  const queryIsDifferentDB = currentQuery.database !== database;
  const queryIsNotDefault = currentQuery.query !== queryDefaultSelect;
  const queryIsNotEmpty = !!trim(currentQuery.query);

  return queryIsDifferentDB || (queryIsNotDefault && queryIsNotEmpty);
}
