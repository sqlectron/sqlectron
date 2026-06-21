import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';

import RootContainer from './containers/root';
import { store } from './store/configure';

let appRoot: Root;

const doRender = (NextRoot) => {
  if (!appRoot) {
    appRoot = createRoot(document.getElementById('content')!);
  }
  appRoot.render(<NextRoot store={store} />);
};

doRender(RootContainer);

if (module.hot) {
  module.hot.accept('./containers/root.tsx', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const NextRoot = require('./containers/root.tsx').default;
    doRender(NextRoot);
  });
}
