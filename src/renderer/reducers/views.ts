import { Action, Reducer } from 'redux';

import { DbTable } from '../../common/types/database';
import * as connTypes from '../actions/connections';
import * as dbTypes from '../actions/databases';
import * as types from '../actions/views';

export interface ViewAction extends Action {
  type: string;
  error: Error;
  isServerConnection: boolean;
  views: Array<string>;
  database: string;
}

export interface ViewState {
  error: null | Error;
  isFetching: boolean;
  didInvalidate: boolean;
  viewsByDatabase: {
    [database: string]: DbTable[];
  };
}

const INITIAL_STATE: ViewState = {
  error: null,
  isFetching: false,
  didInvalidate: false,
  viewsByDatabase: {},
};

const viewReducer: Reducer<ViewState> = function (
  state: ViewState = INITIAL_STATE,
  action,
): ViewState {
  switch (action.type) {
    case connTypes.CONNECTION_REQUEST: {
      return action.isServerConnection ? { ...INITIAL_STATE, didInvalidate: true } : state;
    }
    case types.FETCH_VIEWS_REQUEST: {
      return {
        ...state,
        isFetching: true,
        didInvalidate: false,
        error: null,
      };
    }
    case types.FETCH_VIEWS_SUCCESS: {
      return {
        ...state,
        isFetching: false,
        didInvalidate: false,
        viewsByDatabase: {
          ...state.viewsByDatabase,
          [action.database]: action.views,
        },
        error: null,
      };
    }
    case types.FETCH_VIEWS_FAILURE: {
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

export default viewReducer;
