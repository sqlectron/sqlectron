import { configureStore, Middleware } from '@reduxjs/toolkit';
import { createLogger as createReduxLogger } from 'redux-logger';
import rootReducer from '../reducers';
import { sqlectron, CONFIG } from '../api';

const middlewares: Middleware[] = [];

const isLogConsoleEnabled = CONFIG.log.console;
const isLogFileEnabled = CONFIG.log.file;

if (isLogConsoleEnabled || isLogFileEnabled) {
  const loggerConfig = {
    level: CONFIG.log.level,
    collapsed: true,
    logger: {},
  };

  for (const method in console) {
    // eslint-disable-next-line no-console
    if (typeof console[method] === 'function') {
      // eslint-disable-line no-console
      loggerConfig.logger[method] = function levelFn(...args) {
        if (isLogConsoleEnabled) {
          const m = method === 'debug' ? 'log' : method;
          console[m](...args); // eslint-disable-line no-console
        }

        if (isLogFileEnabled) {
          // log on file only messages with error
          // otherwise is too much private information
          // the user would need to remove to issue a bug
          const lastArg = args[args.length - 1];
          if (lastArg && lastArg.error) {
            sqlectron.logger.error('Error', lastArg.error);
            sqlectron.logger.error('Error Stack', lastArg.error.stack);
          }
        }
      };
    }
  }

  middlewares.push(createReduxLogger(loggerConfig));
}

export const store = configureStore({
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(middlewares),
  reducer: rootReducer,
});

if (module.hot) {
  module.hot.accept(
    '../reducers',
    // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
    () => store.replaceReducer(require('../reducers')),
  );
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
