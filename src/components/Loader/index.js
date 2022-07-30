import React, { Component } from 'react';
import { Helper } from '../../Helper';

import './style.scss';

/**
 * @author Leo Fajardo
 */
class Loader extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="fs-modal fs-modal--loading" {...this.props}>
        <section className="fs-modal-content-container">
          <div className="fs-modal-content">
            {Helper.isNonEmptyString(this.props.title) && (
              <span>{this.props.title}</span>
            )}
            <div className="ripple">
              <div></div>
              <div></div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Loader;
