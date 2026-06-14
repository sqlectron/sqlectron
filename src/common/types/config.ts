import { Server } from './server';

export interface LogOptions {
  console: boolean;
  file: boolean;
  level: string;
  path: string;
}

/**
 * BaseConfig object, which represents what we can save from the settings menu,
 * as well as what might (mostly) be in the config file.
 */
export interface BaseConfig {
  log?: LogOptions;
  zoomFactor?: number;
  limitQueryDefaultSelectTop?: number;
  enabledAutoComplete?: boolean;
  enabledLiveAutoComplete?: boolean;
  // queries: Object;
  enabledDarkTheme?: boolean;
  disabledOpenAnimation?: boolean;
  csvDelimiter?: string;
  connectionsAsList?: boolean;
  customFont?: string;
}

/**
 * This interface documents the sqlectron.json file. The only thing guaranteed to
 * exist is the `servers` key/value pair (instantiated to empty array). The rest
 * will only exist if the user goes into the Settings modal and hits save.
 */
export interface ConfigFile extends BaseConfig {
  servers: Array<Server>;
}

/**
 * This interface documents the instantiated Config object that is fed through
 * sqlectron application. This takes the config loaded by the file, adds in application
 * defaults and fields from package.json, and then utilizes that throughout.
 */
export interface Config extends ConfigFile {
  log: LogOptions;
  zoomFactor: number;
  limitQueryDefaultSelectTop: number;
  enabledAutoComplete: boolean;
  enabledLiveAutoComplete: boolean;
  // queries: Object;
  enabledDarkTheme: boolean;
  disabledOpenAnimation: boolean;
  csvDelimiter: string;
  connectionsAsList: boolean;
  customFont: string;
  // Fields attached from package.json
  name: string;
  version: string;
  homepage?: string;
  bugs?: string;
  repository?: {
    url: string;
  };
  // Fields attached from cli args
  devMode?: boolean;
  printVersion?: boolean;
  // Fields attached in runtime by the config setup
  crypto?: {
    secret: string;
  };
}
