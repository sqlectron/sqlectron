import React, { PropTypes } from 'react';
import { shell } from 'electron';
import UpdateChecker from './update-checker.jsx';


const STYLE = {
  footer: { minHeight: 'auto' },
  status: { paddingLeft: '0.5em' },
};


function onGithubClick(event) {
  event.preventDefault();
  shell.openExternal('https://github.com/sqlectron/sqlectron-gui');
}

function onShortcutsClick(event) {
  event.preventDefault();
  shell.openExternal('https://github.com/sqlectron/sqlectron-gui/wiki/Keyboard-Shortcuts');
}


const Footer = ({ status }) => {
  return (
    <div className="ui bottom fixed menu borderless" style={STYLE.footer}>
      <div style={STYLE.status}>{status}</div>
      <div className="right menu">
        <div className="item">
          <UpdateChecker />
        </div>
        <a href="#" className="item" onClick={onGithubClick}>Github</a>
        <a href="#" className="item" title="Keyboard Shortcuts" onClick={onShortcutsClick}>
          <i className="keyboard icon" />
        </a>
      </div>
    </div>
  );
};


Footer.propTypes = {
  status: PropTypes.string.isRequired,
};


export default Footer;
