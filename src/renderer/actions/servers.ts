import { AnyAction } from 'redux';

import { Server } from '../../common/types/server';
import { sqlectron } from '../api';
import { ThunkResult } from '../reducers';

import * as ConfigActions from './config';

export const SAVE_SERVER_REQUEST = 'SAVE_SERVER_REQUEST';
export const SAVE_SERVER_SUCCESS = 'SAVE_SERVER_SUCCESS';
export const SAVE_SERVER_FAILURE = 'SAVE_SERVER_FAILURE';
export const REMOVE_SERVER_REQUEST = 'REMOVE_SERVER_REQUEST';
export const REMOVE_SERVER_SUCCESS = 'REMOVE_SERVER_SUCCESS';
export const REMOVE_SERVER_FAILURE = 'REMOVE_SERVER_FAILURE';
export const DUPLICATE_SERVER_REQUEST = 'DUPLICATE_SERVER_REQUEST';
export const DUPLICATE_SERVER_SUCCESS = 'DUPLICATE_SERVER_SUCCESS';
export const DUPLICATE_SERVER_FAILURE = 'DUPLICATE_SERVER_FAILURE';
export const START_EDITING_SERVER = 'START_EDITING_SERVER';
export const FINISH_EDITING_SERVER = 'FINISH_EDITING_SERVER';

export function startEditing(id?: string): ThunkResult<void> {
  return async (dispatch, getState) => {
    if (!id) {
      dispatch({ type: START_EDITING_SERVER });
      return;
    }

    const { config } = getState();
    const cryptoSecret = config.data?.crypto?.secret;

    const server = config.data?.servers.find((srv) => srv.id === id);
    if (!server) {
      return;
    }

    const decryptedServer = await sqlectron.servers.decryptSecrects(server, cryptoSecret as string);

    dispatch({ type: START_EDITING_SERVER, server: decryptedServer });
  };
}

export function finishEditing(): AnyAction {
  return { type: FINISH_EDITING_SERVER };
}

export function saveServer({ server, id }: { server: Server; id?: string }): ThunkResult<void> {
  return async (dispatch, getState) => {
    dispatch({ type: SAVE_SERVER_REQUEST, server });
    try {
      const { config } = getState();
      const cryptoSecret = config.data?.crypto?.secret;

      const newServer = Object.assign({}, server, { id });
      const { data, validationErrors } = await sqlectron.servers.addOrUpdate(
        newServer,
        cryptoSecret as string,
      );

      if (validationErrors) {
        dispatch({ type: SAVE_SERVER_FAILURE, error: { validationErrors } });
        return;
      }

      dispatch({
        type: SAVE_SERVER_SUCCESS,
        server: data,
      });

      dispatch(ConfigActions.loadConfig());
    } catch (error) {
      dispatch({ type: SAVE_SERVER_FAILURE, error });
    }
  };
}

export function removeServer({ id }: { id: string }): ThunkResult<void> {
  return async (dispatch) => {
    dispatch({ type: REMOVE_SERVER_REQUEST, id });
    try {
      await sqlectron.servers.removeById(id);

      dispatch({
        type: REMOVE_SERVER_SUCCESS,
        id,
      });
    } catch (error) {
      dispatch({ type: REMOVE_SERVER_FAILURE, error });
    }
  };
}

export function duplicateServer({ server }: { server: Server }): ThunkResult<void> {
  return async (dispatch, getState) => {
    dispatch({ type: DUPLICATE_SERVER_REQUEST, server });
    try {
      const newName = await getUniqueName(server);
      const duplicated = { ...server, name: newName };
      duplicated.id = '';

      const { config } = getState();
      const cryptoSecret = config.data?.crypto?.secret;

      const { data, validationErrors } = await sqlectron.servers.addOrUpdate(
        duplicated,
        cryptoSecret as string,
      );

      if (validationErrors) {
        dispatch({ type: SAVE_SERVER_FAILURE, error: { validationErrors } });
        return;
      }

      dispatch({
        type: DUPLICATE_SERVER_SUCCESS,
        server: data,
      });

      dispatch(ConfigActions.loadConfig());
    } catch (error) {
      dispatch({ type: DUPLICATE_SERVER_FAILURE, error });
    }
  };
}

async function getUniqueName(server: Server): Promise<string> {
  const dataServers = await sqlectron.servers.getAll();
  const duplicatedName = (name) => dataServers.some((srv) => srv.name === name);
  let currentName = server.name;
  let num = 0;
  while (duplicatedName(currentName)) {
    num += 1;
    currentName = `${server.name}-${num}`;
  }
  return currentName;
}
