import { getConfig } from './config';
import * as sqlectron from './core';

const configData = getConfig();

if (configData.printVersion) {
  console.log(configData.name, configData.version); // eslint-disable-line no-console
  process.exit(0);
}

if (
  configData.limitQueryDefaultSelectTop !== undefined &&
  configData.limitQueryDefaultSelectTop !== null
) {
  sqlectron.setSelectLimit();
}

// starts the electron app
import './app';
