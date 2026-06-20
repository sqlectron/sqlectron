import { Action, Reducer } from 'redux';

import { Config as ConfigType } from '../../common/types/config';
import * as types from '../actions/config';

export interface Config {
  database: string;
  queryHistory: Array<string>;
}

export interface ConfigAction extends Action {
  error: Error;
  type: string;
  config: ConfigType;
  path: string;
}

export interface ConfigState {
  isSaving: boolean;
  isEditing: boolean;
  path: null | string;
  data: null | ConfigType;
  error: null | Error;
  isLoaded: boolean;
}

const INITIAL_STATE: ConfigState = {
  isSaving: false,
  isEditing: false,
  path: null,
  data: null,
  error: null,
  isLoaded: false,
};

const configReducer: Reducer<ConfigState> = function (
  state: ConfigState = INITIAL_STATE,
  action,
): ConfigState {
  switch (action.type) {
    case types.LOAD_CONFIG_SUCCESS:
      return {
        ...state,
        data: action.config,
        path: action.path,
        isLoaded: true,
      };
    case types.LOAD_CONFIG_FAILURE: {
      return {
        ...state,
        error: action.error,
        isLoaded: true,
      };
    }
    case types.START_EDITING_CONFIG: {
      return {
        ...state,
        isSaving: false,
        isEditing: true,
      };
    }
    case types.FINISH_EDITING_CONFIG: {
      return {
        ...state,
        isSaving: false,
        isEditing: false,
        isLoaded: true,
        error: null,
      };
    }
    case types.SAVE_CONFIG_REQUEST: {
      return {
        ...state,
        isSaving: true,
      };
    }
    case types.SAVE_CONFIG_SUCCESS: {
      return {
        ...state,
        data: {
          ...state.data,
          ...action.config,
        },
        isSaving: false,
      };
    }
    default:
      return state;
  }
};

export default configReducer;
