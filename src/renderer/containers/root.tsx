import { Store } from '@reduxjs/toolkit';
import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import App from './app';
import QueryBrowserContainer from './query-browser';
import ServerManagementContainer from './server-management';

interface Props {
  store: Store;
}

const Root: FC<Props> = ({ store }) => (
  <Provider store={store}>
    <Router>
      <App>
        <Switch>
          <Route exact path="/" component={ServerManagementContainer} />
          <Route path="/server/:id" component={QueryBrowserContainer} />
        </Switch>
      </App>
    </Router>
  </Provider>
);

Root.displayName = 'Root';
export default Root;
