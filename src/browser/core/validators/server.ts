import Joi from 'joi';
import { CLIENTS } from 'sqlectron-db-core';
import { Server } from '../../../common/types/server';

export type ValidationErrors = Record<string, string>;

export class ServerValidationError extends Error {
  validationErrors: ValidationErrors;

  constructor(validationErrors: ValidationErrors) {
    super('Server validation failed');
    this.name = 'ServerValidationError';
    this.validationErrors = validationErrors;
  }
}

// password may be a plain string or an already encrypted value, and at least
// one of them must end up non-empty once trimmed.
const PASSWORD_SCHEMA = Joi.alternatives()
  .try(
    Joi.string().trim().min(1),
    Joi.object({
      ivText: Joi.string().trim().allow(''),
      encryptedText: Joi.string().trim().allow(''),
    }).custom((value, helpers) => {
      if (!value.ivText && !value.encryptedText) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'encrypted password'),
  )
  .allow(null);

const SSH_SCHEMA = Joi.object({
  host: Joi.string().trim().min(1),
  port: Joi.number().integer().min(0).max(99999),
  user: Joi.string().trim().min(1).required(),
  password: PASSWORD_SCHEMA,
  privateKey: Joi.string().trim().min(1),
  privateKeyWithPassphrase: Joi.boolean(),
  useAgent: Joi.boolean(),
}).unknown(true);

// fields that, together, determine how a server can be reached. Exactly one
// of host or socketPath is required, and host requires port (and vice-versa).
const ADDRESS_FIELDS = ['host', 'port', 'socketPath'];

function buildServerSchema(disabledFields: Set<string>): {
  schema: Joi.ObjectSchema;
  addressFields: string[];
} {
  const fields: Record<string, Joi.Schema> = {
    name: Joi.string().trim().min(1).required(),
    client: Joi.string()
      .trim()
      .required()
      .valid(...CLIENTS.map((dbClient) => dbClient.key)),
    ssl: Joi.alternatives().try(Joi.boolean(), Joi.object()).required(),
    host: Joi.string().trim().min(1),
    port: Joi.number().integer().min(0).max(99999),
    socketPath: Joi.string().trim().min(1),
    database: Joi.string().trim().min(1),
    user: Joi.string().trim().min(1),
    password: PASSWORD_SCHEMA,
    ssh: SSH_SCHEMA,
  };

  disabledFields.forEach((field) => delete fields[field]);

  let schema = Joi.object(fields).unknown(true);

  if (fields.host && fields.socketPath) {
    schema = schema.xor('host', 'socketPath');
  }
  if (fields.host && fields.port) {
    schema = schema.and('host', 'port');
  }

  const addressFields = ADDRESS_FIELDS.filter((field) => fields[field]);

  return { schema, addressFields };
}

function toValidationErrors(error: Joi.ValidationError, addressFields: string[]): ValidationErrors {
  const errors: ValidationErrors = {};

  error.details.forEach((detail) => {
    if (detail.path.length === 0) {
      // object-level errors (e.g. host/port/socketPath relationship) apply to
      // all of the address fields so the form can highlight them.
      addressFields.forEach((field) => {
        errors[field] = detail.message;
      });
      return;
    }

    errors[detail.path.join('.')] = detail.message;
  });

  return errors;
}

/**
 * validations applied on creating/updating a server
 *
 * Returns the sanitized server (e.g. trimmed strings, numeric ports) on
 * success, or throws a ServerValidationError on failure.
 */
export async function validate(server: Server): Promise<Server> {
  const disabledFields = new Set<string>();

  const clientConfig = CLIENTS.find((dbClient) => dbClient.key === server.client);
  if (clientConfig) {
    clientConfig.disabledFeatures.forEach((item) => {
      const [region, field] = item.split(':');
      if (region === 'server') {
        disabledFields.add(field);
      }
    });
  }

  const { schema, addressFields } = buildServerSchema(disabledFields);

  const { value, error } = schema.validate(server, { abortEarly: false });
  if (error) {
    throw new ServerValidationError(toValidationErrors(error, addressFields));
  }

  return value as Server;
}

export function validateUniqueId(servers: Array<Server>, serverId?: string | null): boolean {
  if (!serverId) {
    throw new Error('serverId should be set');
  }

  return !servers.find((srv) => srv.id === serverId);
}
