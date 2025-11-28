import { Action, Reducer } from 'redux';
import * as types from '../actions/servers';
import * as configTypes from '../actions/config';
import { Server } from '../../common/types/server';

export interface ValidationError {
  validationErrors: Array<Error>;
}

export interface ServerAction extends Action {
  type: string;
  error: ValidationError;
  server: Server;
  config: {
    servers: Array<Server>;
  };
  id: string;
}

export interface ServerState {
  error: null | ValidationError;
  isSaving: boolean;
  isEditing: boolean;
  items: Array<Server>;
  editingServer: null | Server;
}

const INITIAL_STATE: ServerState = {
  error: null,
  isSaving: false,
  isEditing: false,
  items: [],
  editingServer: null,
};

const serverReducer: Reducer<ServerState> = function (
  state: ServerState = INITIAL_STATE,
  action,
): ServerState {
  switch (action.type) {
    case configTypes.LOAD_CONFIG_SUCCESS:
      return {
        ...state,
        items: action.config.servers,
      };
    case types.START_EDITING_SERVER: {
      return {
        ...state,
        isSaving: false,
        isEditing: true,
        editingServer: action.server || null,
      };
    }
    case types.FINISH_EDITING_SERVER: {
      return {
        ...state,
        isSaving: false,
        isEditing: false,
        editingServer: null,
        error: null,
      };
    }
    case types.SAVE_SERVER_REQUEST:
    case types.DUPLICATE_SERVER_REQUEST:
    case types.REMOVE_SERVER_REQUEST: {
      return {
        ...state,
        isSaving: true,
      };
    }
    case types.SAVE_SERVER_SUCCESS:
    case types.DUPLICATE_SERVER_SUCCESS: {
      return {
        ...state,
        items: save(state.items, action.server),
        error: null,
        isSaving: false,
        isEditing: false,
      };
    }
    case types.REMOVE_SERVER_SUCCESS:
      return {
        ...state,
        items: remove(state.items, action.id),
        error: null,
        isSaving: false,
        isEditing: false,
      };
    case types.SAVE_SERVER_FAILURE:
    case types.DUPLICATE_SERVER_FAILURE:
    case types.REMOVE_SERVER_FAILURE: {
      return {
        ...state,
        error: action.error.validationErrors,
        isSaving: false,
      };
    }
    default:
      return state;
  }
};

function save(dataItems: Server[], server: Server) {
  const items = [...dataItems];
  const index = server.id ? items.findIndex((srv) => srv.id === server.id) : -1;
  if (index >= 0) {
    items[index] = server;
  } else {
    items.push(server);
  }
  return items;
}

function remove(items: Server[], id: string) {
  const index = items.findIndex((srv) => srv.id === id);
  return [...items.slice(0, index), ...items.slice(index + 1)];
}

export default serverReducer;
