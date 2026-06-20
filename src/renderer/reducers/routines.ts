import { Action, Reducer } from 'redux';

import * as connTypes from '../actions/connections';
import * as dbTypes from '../actions/databases';
import * as types from '../actions/routines';

export interface Routine {
  schema: string;
  name: string;
  routineDefinition: string;
}

export interface RoutineAction extends Action {
  type: string;
  error: Error;
  isServerConnection: boolean;
  database: string;
  routines: Array<{
    schema: string;
    routineName: string;
    routineDefinition: string;
    routineType: string;
  }>;
}

export interface RoutineState {
  error: null | Error;
  isFetching: boolean;
  didInvalidate: boolean;
  functionsByDatabase: {
    [db: string]: Array<Routine>;
  };
  proceduresByDatabase: {
    [db: string]: Array<Routine>;
  };
}

const INITIAL_STATE: RoutineState = {
  error: null,
  isFetching: false,
  didInvalidate: false,
  functionsByDatabase: {},
  proceduresByDatabase: {},
};

const routineReducer: Reducer<RoutineState> = function (
  state: RoutineState = INITIAL_STATE,
  action,
): RoutineState {
  switch (action.type) {
    case connTypes.CONNECTION_REQUEST: {
      return action.isServerConnection ? { ...INITIAL_STATE, didInvalidate: true } : state;
    }
    case types.FETCH_ROUTINES_REQUEST: {
      return {
        ...state,
        isFetching: true,
        didInvalidate: false,
        error: null,
      };
    }
    case types.FETCH_ROUTINES_SUCCESS: {
      return {
        ...state,
        isFetching: false,
        didInvalidate: false,
        functionsByDatabase: {
          ...state.functionsByDatabase,
          [action.database]: action.routines.filter(isFunction).map((routine) => ({
            schema: routine.schema,
            name: routine.routineName,
            routineDefinition: routine.routineDefinition,
          })),
        },
        proceduresByDatabase: {
          ...state.proceduresByDatabase,
          [action.database]: action.routines.filter(isProcedure).map((routine) => ({
            schema: routine.schema,
            name: routine.routineName,
            routineDefinition: routine.routineDefinition,
          })),
        },
        error: null,
      };
    }
    case types.FETCH_ROUTINES_FAILURE: {
      return {
        ...state,
        isFetching: false,
        didInvalidate: true,
        error: action.error,
      };
    }
    case dbTypes.REFRESH_DATABASES: {
      return {
        ...state,
        didInvalidate: true,
      };
    }
    default:
      return state;
  }
};

function isFunction(routine) {
  return routine.routineType === 'FUNCTION';
}

function isProcedure(routine) {
  return routine.routineType === 'PROCEDURE';
}
export default routineReducer;
