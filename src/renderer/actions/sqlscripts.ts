import { sqlectron } from '../api';
import { ApplicationState, ThunkResult } from '../reducers';
import type { ActionType, ObjectType } from '../reducers/sqlscripts';

import { appendQuery } from './queries';

export const GET_SCRIPT_REQUEST = 'GET_SCRIPT_REQUEST';
export const GET_SCRIPT_SUCCESS = 'GET_SCRIPT_SUCCESS';
export const GET_SCRIPT_FAILURE = 'GET_SCRIPT_FAILURE';

export function getSQLScriptIfNeeded(
  database: string,
  item: string,
  actionType: ActionType,
  objectType: ObjectType,
  schema?: string,
): ThunkResult<void> {
  return (dispatch, getState) => {
    const state = getState();
    if (shouldFetchScript(state, database, item, actionType)) {
      dispatch(getSQLScript(database, item, actionType, objectType, schema));
      return;
    }

    if (isScriptAlreadyFetched(state, database, item, actionType)) {
      const script = getAlreadyFetchedScript(state, database, item, actionType);
      dispatch(appendQuery(script));
    }
  };
}

function shouldFetchScript(
  state: ApplicationState,
  database: string,
  item: string,
  actionType: ActionType,
): boolean {
  const scripts = state.sqlscripts;
  if (!scripts) return true;
  if (scripts.isFetching) return false;
  if (!scripts.scriptsByObject[database]) return true;
  if (!scripts.scriptsByObject[database][item]) return true;
  if (!scripts.scriptsByObject[database][item][actionType]) return true;
  return scripts.didInvalidate;
}

function isScriptAlreadyFetched(
  state: ApplicationState,
  database: string,
  item: string,
  actionType: string,
): boolean {
  const scripts = state.sqlscripts;
  if (!scripts.scriptsByObject[database]) return false;
  if (!scripts.scriptsByObject[database][item]) return false;
  if (scripts.scriptsByObject[database][item][actionType]) return true;
  return false;
}

function getAlreadyFetchedScript(
  state: ApplicationState,
  database: string,
  item: string,
  actionType: string,
) {
  return state.sqlscripts.scriptsByObject[database][item][actionType];
}

function getSQLScript(
  database: string,
  item: string,
  actionType: ActionType,
  objectType: ObjectType,
  schema?: string,
): ThunkResult<void> {
  return async (dispatch) => {
    dispatch({
      type: GET_SCRIPT_REQUEST,
      database,
      item,
      actionType,
      objectType,
    });
    try {
      let script;
      if (actionType === 'CREATE' && objectType === 'Table') {
        [script] = await sqlectron.db.getTableCreateScript(database, item, schema);
      } else if (actionType === 'CREATE' && objectType === 'View') {
        [script] = await sqlectron.db.getViewCreateScript(database, item, schema);
      } else if (actionType === 'CREATE') {
        [script] = await sqlectron.db.getRoutineCreateScript(database, item, objectType, schema);
      } else if (actionType === 'SELECT') {
        script = await sqlectron.db.getTableSelectScript(database, item, schema);
      } else if (actionType === 'INSERT') {
        script = await sqlectron.db.getTableInsertScript(database, item, schema);
      } else if (actionType === 'UPDATE') {
        script = await sqlectron.db.getTableUpdateScript(database, item, schema);
      } else if (actionType === 'DELETE') {
        script = await sqlectron.db.getTableDeleteScript(database, item, schema);
      }

      dispatch({
        type: GET_SCRIPT_SUCCESS,
        database,
        item,
        script,
        actionType,
        objectType,
      });
      dispatch(appendQuery(script));
    } catch (error) {
      dispatch({ type: GET_SCRIPT_FAILURE, error });
    }
  };
}
