import { DatabaseFilter, SchemaFilter } from 'sqlectron-db-core';

export interface EncryptedPassword {
  ivText: string;
  encryptedText: string;
}

export interface ServerResult {
  data?: Server;
  validationErrors?: Record<string, string>;
}

export interface Server {
  id: string;
  name: string;
  client: string;
  adapter?: string;
  host?: string;
  socketPath?: string;
  port?: number;
  localHost?: string;
  localPort?: number;
  user?: string;
  password: EncryptedPassword | string;
  applicationName?: string;
  domain?: string;
  ssh?: {
    user: string;
    password: EncryptedPassword | string | null;
    passphrase?: string;
    privateKey?: string | null;
    host: string;
    port: number;
    privateKeyWithPassphrase?: boolean;
    useAgent?: boolean;
  };
  ssl?:
    | {
        key?: string;
        ca?: string;
        cert?: string;
      }
    | boolean;
  encrypted?: boolean;
  database: string;
  schema?: string;
  filter?: DatabaseFilter & SchemaFilter;
}
