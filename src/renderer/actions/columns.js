import { getDBConnByName } from './connections';


export const FETCH_COLUMNS_REQUEST = 'FETCH_COLUMNS_REQUEST';
export const FETCH_COLUMNS_SUCCESS = 'FETCH_COLUMNS_SUCCESS';
export const FETCH_COLUMNS_FAILURE = 'FETCH_COLUMNS_FAILURE';


export function fetchTableColumnsIfNeeded (database, table, schema) {
  return (dispatch, getState) => {
    if (shouldFetchTableColumns(getState(), database, table, schema)) {
      dispatch(fetchTableColumns(database, table, schema));
    }
  };
}


function shouldFetchTableColumns (state, database, table) {
  const columns = state.columns;
  if (!columns) return true;
  if (columns.isFetching[database] && columns.isFetching[database][table]) return false;
  if (!columns.columnsByTable[database]) return true;
  if (!columns.columnsByTable[database][table]) return true;
  return columns.didInvalidate;
}


function fetchTableColumns (database, table, schema) {
  return async dispatch => {
    dispatch({ type: FETCH_COLUMNS_REQUEST, database, table });
    try {
      const dbConn = getDBConnByName(database);
      const columns = await dbConn.listTableColumns(table, schema);
      dispatch({ type: FETCH_COLUMNS_SUCCESS, database, table, columns });
    } catch (error) {
      dispatch({ type: FETCH_COLUMNS_FAILURE, error });
    }
  };
}
