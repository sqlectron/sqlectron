import { AnyAction } from 'redux';
import { ApplicationState, ThunkResult } from '../reducers';
import { getDatabaseByQueryID } from './connections';
import { sqlectron } from '../api';
import type { DatabaseFilter } from '../../common/types/database';

export const REFRESH_DATABASES = 'REFRESH_DATABASES';
export const FETCH_DATABASES_REQUEST = 'FETCH_DATABASES_REQUEST';
export const FETCH_DATABASES_SUCCESS = 'FETCH_DATABASES_SUCCESS';
export const FETCH_DATABASES_FAILURE = 'FETCH_DATABASES_FAILURE';
export const FILTER_DATABASES = 'FILTER_DATABASES';

export function filterDatabases(name: string): AnyAction {
  return { type: FILTER_DATABASES, name };
}

export function refreshDatabase(name: string): AnyAction {
  return { type: REFRESH_DATABASES, name };
}

export function fetchDatabasesIfNeeded(filter?: DatabaseFilter): ThunkResult<void> {
  return (dispatch, getState) => {
    if (shouldFetchDatabases(getState())) {
      dispatch(fetchDatabases(filter));
    }
  };
}

function shouldFetchDatabases(state: ApplicationState): boolean {
  const databases = state.databases;
  if (!databases) return true;
  if (databases.isFetching) return false;
  return databases.didInvalidate;
}

function fetchDatabases(filter?: DatabaseFilter): ThunkResult<void> {
  return async (dispatch, getState) => {
    dispatch({ type: FETCH_DATABASES_REQUEST });
    try {
      const database = getDatabaseByQueryID(getState());
      const databases = await sqlectron.db.listDatabases(database, filter);
      dispatch({ type: FETCH_DATABASES_SUCCESS, databases });
    } catch (error) {
      dispatch({ type: FETCH_DATABASES_FAILURE, error });
    }
  };
}
