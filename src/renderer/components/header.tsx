import React, { FC } from 'react';
import { sqlectron } from '../api';

import LOGO_PATH from './logo-128px.png';

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./header.css');

function onSiteClick(event) {
  event.preventDefault();
  sqlectron.browser.shell.openExternal('https://sqlectron.github.io');
}

function renderBreadcrumb(items) {
  return (
    <div className="ui breadcrumb" style={{ margin: '0 auto' }}>
      {items.map(({ icon, label }, index) => {
        const isLast = index !== items.length - 1;
        return (
          <span key={index + label}>
            <i className={`${icon} icon`} />
            <a className={`section ${isLast ? 'active' : ''}`}>{label}</a>
            {isLast && <div className="divider"> / </div>}
          </span>
        );
      })}
    </div>
  );
}

interface Props {
  items: { icon: string; label: string }[];
  onCloseConnectionClick?: () => void;
  onReConnectionClick?: () => void;
}

const Header: FC<Props> = ({ items, onCloseConnectionClick, onReConnectionClick }) => {
  const visibilityButtons = onCloseConnectionClick ? 'visible' : 'hidden';
  const styleItem = { paddingLeft: 0, paddingTop: 0, paddingBottom: 0 };
  return (
    <div id="header" className="ui top fixed menu borderless">
      <a href="#" className="item" onClick={onSiteClick}>
        <img alt="logo" src={LOGO_PATH} style={{ width: '5.5em' }} />
      </a>
      <div style={{ margin: '0 auto' }}>
        <div className="item" style={{ marginLeft: '-109px', marginRight: '-94px' }}>
          {renderBreadcrumb(items)}
        </div>
      </div>
      <div className="right menu" style={{ visibility: visibilityButtons }}>
        <div className="item borderless" style={styleItem}>
          <div className="ui mini basic icon buttons">
            <button className="ui button" title="Reconnect" onClick={onReConnectionClick}>
              <i className="plug icon" />
            </button>
            <button
              className="ui icon button"
              title="Close connection"
              onClick={onCloseConnectionClick}>
              <i className="power icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Header.displayName = 'Header';

export default Header;
