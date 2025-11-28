import { v4 as uuidv4 } from 'uuid';
import { validate, validateUniqueId } from './validators/server';
import * as config from './config';
import * as crypto from './crypto';
import { Server, ServerResult, EncryptedPassword } from '../../common/types/server';

export async function getAll(): Promise<Array<Server>> {
  const { servers } = await config.get();
  return servers;
}

export async function add(server: Server, cryptoSecret: string): Promise<ServerResult> {
  let srv = { ...server };

  const validationErrors = await getValidationErrors(srv);
  if (validationErrors) {
    return { validationErrors };
  }

  const data = await config.get();
  let newId;
  do {
    newId = uuidv4();
  } while (!validateUniqueId(data.servers, newId));

  srv = encryptSecrects(srv, cryptoSecret);

  srv.id = newId;
  data.servers.push(srv);
  await config.save(data);

  return { data: srv };
}

export async function update(server: Server, cryptoSecret: string): Promise<ServerResult> {
  let srv = { ...server };

  const validationErrors = await getValidationErrors(srv);
  if (validationErrors) {
    return { validationErrors };
  }

  const data = await config.get();

  const index = data.servers.findIndex((item) => item.id === srv.id);
  srv = encryptSecrects(srv, cryptoSecret, data.servers[index]);

  data.servers = [...data.servers.slice(0, index), srv, ...data.servers.slice(index + 1)];

  await config.save(data);

  return { data: srv };
}

export function addOrUpdate(server: Server, cryptoSecret: string): Promise<ServerResult> {
  const hasId = !!(server.id && String(server.id).length);
  // TODO: Add validation to check if the current id is a valid uuid
  return hasId ? update(server, cryptoSecret) : add(server, cryptoSecret);
}

export async function removeById(id: string): Promise<void> {
  const data = await config.get();

  const index = data.servers.findIndex((srv) => srv.id === id);
  data.servers = [...data.servers.slice(0, index), ...data.servers.slice(index + 1)];

  await config.save(data);
}

// ensure all secret fields are encrypted
function encryptSecrects(server: Server, cryptoSecret: string, oldServer?: Server): Server {
  const updatedServer = { ...server };

  if (server.password) {
    if (
      oldServer &&
      oldServer.password &&
      typeof oldServer.password === 'string' &&
      oldServer.encrypted
    ) {
      if (server.password === oldServer.password) {
        updatedServer.password = crypto.unsafeDecrypt(oldServer.password, cryptoSecret);
      }
    }

    if (typeof updatedServer.password === 'string') {
      updatedServer.password = crypto.encrypt(updatedServer.password, cryptoSecret);
    }
  }

  if (server.ssh && server.ssh.password) {
    if (
      oldServer &&
      oldServer.ssh &&
      oldServer.ssh.password &&
      typeof oldServer.ssh.password === 'string' &&
      oldServer.encrypted
    ) {
      if (server.password === oldServer.password) {
        updatedServer.password = crypto.unsafeDecrypt(oldServer.password as string, cryptoSecret);
      }
    }

    if (updatedServer.ssh && typeof updatedServer.ssh.password === 'string') {
      updatedServer.ssh.password = crypto.encrypt(updatedServer.ssh.password, cryptoSecret);
    }
  }

  updatedServer.encrypted = true;
  return updatedServer;
}

// decrypt secret fields
export function decryptSecrects(server: Server, cryptoSecret: string): Server {
  const updatedServer = { ...server };
  if (!server.encrypted) {
    return server;
  }

  if (server.password) {
    if (typeof server.password === 'string') {
      updatedServer.password = crypto.unsafeDecrypt(server.password, cryptoSecret);
    } else {
      updatedServer.password = crypto.decrypt(server.password as EncryptedPassword, cryptoSecret);
    }
  }

  if (server.ssh && server.ssh.password && updatedServer.ssh) {
    if (typeof server.ssh.password === 'string') {
      updatedServer.ssh.password = crypto.unsafeDecrypt(server.ssh.password, cryptoSecret);
    } else {
      updatedServer.ssh.password = crypto.decrypt(
        server.ssh.password as EncryptedPassword,
        cryptoSecret,
      );
    }
  }

  updatedServer.encrypted = false;
  return updatedServer;
}

interface ValidationError extends Error {
  validationErrors?: { [key: string]: Error };
}

async function getValidationErrors(
  server: Server,
): Promise<Required<Pick<ValidationError, 'validationErrors'>>['validationErrors'] | undefined> {
  try {
    await validate(server);
  } catch (err) {
    const typedError = err as ValidationError;
    if (typedError.validationErrors) {
      return typedError.validationErrors;
    }

    throw err;
  }
}
