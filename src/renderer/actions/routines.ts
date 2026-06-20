import { SchemaFilter } from '../../common/types/database';
import { sqlectron } from '../api';
import { ApplicationState, ThunkResult } from '../reducers';

export const FETCH_ROUTINES_REQUEST = 'FETCH_ROUTINES_REQUEST';
export const FETCH_ROUTINES_SUCCESS = 'FETCH_ROUTINES_SUCCESS';
export const FETCH_ROUTINES_FAILURE = 'FETCH_ROUTINES_FAILURE';

export function fetchRoutinesIfNeeded(database: string, filter?: SchemaFilter): ThunkResult<void> {
  return (dispatch, getState) => {
    if (shouldFetchRoutines(getState(), database)) {
      dispatch(fetchRoutines(database, filter));
    }
  };
}

function shouldFetchRoutines(state: ApplicationState, database: string): boolean {
  const routines = state.routines;
  if (!routines) return true;
  if (routines.isFetching) return false;
  if (!routines.functionsByDatabase[database]) return true;
  if (!routines.proceduresByDatabase[database]) return true;
  return routines.didInvalidate;
}

function fetchRoutines(database: string, filter?: SchemaFilter): ThunkResult<void> {
  return async (dispatch) => {
    dispatch({ type: FETCH_ROUTINES_REQUEST, database });
    try {
      const routines = await sqlectron.db.listRoutines(database, filter);
      dispatch({ type: FETCH_ROUTINES_SUCCESS, database, routines });
    } catch (error) {
      dispatch({ type: FETCH_ROUTINES_FAILURE, error });
    }
  };
}
