/**
 * unified-dataloader-gui
 * Copyright (C) 2018 Armarti Industries
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import React, { Component, PropTypes } from 'react';


export default class PromptModal extends Component {
  static propTypes = {
    onCancelClick: PropTypes.func.isRequired,
    onOKClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }

  componentDidMount() {
    $(this.refs.promptModal).modal({
      closable: false,
      detachable: false,
      onDeny: () => {
        this.props.onCancelClick();
        return true;
      },
      onApprove: () => {
        this.props.onOKClick(this.state.value);
        return true;
      },
    }).modal('show');
  }

  componentWillUnmount() {
    $(this.refs.promptModal).modal('hide');
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      this.props.onOKClick(this.state.value);
    }
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  render() {
    const { title, message, type } = this.props;

    return (
      <div className="ui modal" ref="promptModal">
        <div className="header">
          {title}
        </div>
        <div className="content">
          {message}
          <div className="ui fluid icon input">
            <input onChange={::this.handleChange} type={type} onKeyPress={::this.handleKeyPress} />
          </div>
        </div>
        <div className="actions">
          <div className="small ui black deny right labeled icon button" tabIndex="0">
            Cancel
            <i className="ban icon"></i>
          </div>
          <div className="small ui positive right labeled icon button" tabIndex="0">
            OK
            <i className="checkmark icon"></i>
          </div>
        </div>
      </div>
    );
  }
}
