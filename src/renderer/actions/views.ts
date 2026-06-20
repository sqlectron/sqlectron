import { SchemaFilter } from '../../common/types/database';
import { sqlectron } from '../api';
import { ApplicationState, ThunkResult } from '../reducers';

export const FETCH_VIEWS_REQUEST = 'FETCH_VIEWS_REQUEST';
export const FETCH_VIEWS_SUCCESS = 'FETCH_VIEWS_SUCCESS';
export const FETCH_VIEWS_FAILURE = 'FETCH_VIEWS_FAILURE';

export function fetchViewsIfNeeded(database: string, filter?: SchemaFilter): ThunkResult<void> {
  return (dispatch, getState) => {
    if (shouldFetchViews(getState(), database)) {
      dispatch(fetchViews(database, filter));
    }
  };
}

function shouldFetchViews(state: ApplicationState, database: string): boolean {
  const views = state.views;
  if (!views) return true;
  if (views.isFetching) return false;
  if (!views.viewsByDatabase[database]) return true;
  return views.didInvalidate;
}

function fetchViews(database: string, filter?: SchemaFilter): ThunkResult<void> {
  return async (dispatch) => {
    dispatch({ type: FETCH_VIEWS_REQUEST, database });
    try {
      const views = await sqlectron.db.listViews(database, filter);
      dispatch({ type: FETCH_VIEWS_SUCCESS, database, views });
    } catch (error) {
      dispatch({ type: FETCH_VIEWS_FAILURE, error });
    }
  };
}
