import { sqlectron } from '../api';
import { ApplicationState, ThunkResult } from '../reducers';
import { SchemaFilter } from '../../common/types/database';

export const FETCH_TABLES_REQUEST = 'FETCH_TABLES_REQUEST';
export const FETCH_TABLES_SUCCESS = 'FETCH_TABLES_SUCCESS';
export const FETCH_TABLES_FAILURE = 'FETCH_TABLES_FAILURE';

export function fetchTablesIfNeeded(database: string, filter?: SchemaFilter): ThunkResult<void> {
  return (dispatch, getState) => {
    if (shouldFetchTables(getState(), database)) {
      dispatch(fetchTables(database, filter));
    }
  };
}

function shouldFetchTables(state: ApplicationState, database: string): boolean {
  const tables = state.tables;
  if (!tables) return true;
  if (tables.isFetching) return false;
  if (!tables.itemsByDatabase[database]) return true;
  return tables.didInvalidate;
}

function fetchTables(database: string, filter?: SchemaFilter): ThunkResult<void> {
  return async (dispatch) => {
    dispatch({ type: FETCH_TABLES_REQUEST, database });
    try {
      const tables = await sqlectron.db.listTables(database, filter);
      dispatch({ type: FETCH_TABLES_SUCCESS, database, tables });
    } catch (error) {
      dispatch({ type: FETCH_TABLES_FAILURE, error });
    }
  };
}
