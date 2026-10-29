import React, { Component } from 'react';

/**
 * @author Leo Fajardo
 */
class Placeholder extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    // A class lets a placeholder hold the place of the element it stands in for (its row in the card grid).
    return (
      <div
        className={
          'fs-placeholder' +
          (this.props.className ? ' ' + this.props.className : '')
        }
      ></div>
    );
  }
}

export default Placeholder;
