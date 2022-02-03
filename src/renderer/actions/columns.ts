import { sqlectron } from '../api';
import { ApplicationState, ThunkResult } from '../reducers';

export const FETCH_COLUMNS_REQUEST = 'FETCH_COLUMNS_REQUEST';
export const FETCH_COLUMNS_SUCCESS = 'FETCH_COLUMNS_SUCCESS';
export const FETCH_COLUMNS_FAILURE = 'FETCH_COLUMNS_FAILURE';

export function fetchTableColumnsIfNeeded(
  database: string,
  table: string,
  schema?: string,
): ThunkResult<void> {
  return (dispatch, getState) => {
    if (shouldFetchTableColumns(getState(), database, table)) {
      dispatch(fetchTableColumns(database, table, schema));
    }
  };
}

function shouldFetchTableColumns(
  state: ApplicationState,
  database: string,
  table: string,
): boolean {
  const columns = state.columns;
  if (!columns) return true;
  if (columns.isFetching[database] && columns.isFetching[database][table]) return false;
  if (!columns.columnsByTable[database]) return true;
  if (!columns.columnsByTable[database][table]) return true;
  return columns.didInvalidate;
}

function fetchTableColumns(database: string, table: string, schema?: string): ThunkResult<void> {
  return async (dispatch) => {
    dispatch({ type: FETCH_COLUMNS_REQUEST, database, table });
    try {
      const columns = await sqlectron.db.listTableColumns(database, table, schema);
      dispatch({
        type: FETCH_COLUMNS_SUCCESS,
        database,
        table,
        columns,
      });
    } catch (error) {
      dispatch({ type: FETCH_COLUMNS_FAILURE, error });
    }
  };
}
