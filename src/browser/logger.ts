import log from 'electron-log/main';
import * as sqlectron from './core';
import { getConfig } from './config';
import { LogOptions } from '../common/types/config';

type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';

/**
 * Applies the given log settings to the shared electron-log transports.
 * Since every scoped logger reads from these same transport objects,
 * calling this again (e.g. after the user changes settings) updates
 * logging behavior across the app immediately, without a restart.
 */
export function applyLogConfig(logOptions: LogOptions): void {
  const level = logOptions.level as LogLevel;
  log.transports.console.level = logOptions.console ? level : false;
  log.transports.file.level = logOptions.file ? level : false;
  log.transports.file.resolvePathFn = () => logOptions.path;
}

applyLogConfig(getConfig().log);

// Set custom logger for sqlectron-core
sqlectron.setLogger((namespace) => log.scope(`sqlectron-core:${namespace}`));

export default (namespace: string) => log.scope(namespace);
