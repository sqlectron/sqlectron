import React from 'react';
import ReactDOM from 'react-dom';
import { store } from './store/configure';
import Root from './containers/root';

const doRender = (NextRoot) => {
  ReactDOM.render(<NextRoot store={store} />, document.getElementById('content'));
};

doRender(Root);

if (module.hot) {
  module.hot.accept('./containers/root.tsx', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const NextRoot = require('./containers/root.tsx').default;
    doRender(NextRoot);
  });
}
