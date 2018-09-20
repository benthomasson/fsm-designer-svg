import React, { Component } from 'react';

class Cursor extends Component {
  render() {
    var debugStyle = {
      stroke: 'rgb(77,200,242)',
      fill: 'none'
    };
    return (
    <g transform={this.props.transform}>
        <line x1="-15" y1="0" x2="15" y2="0" style={debugStyle} />
        <line x1="0" y1="-15" x2="0" y2="15" style={debugStyle} />
    </g>
    );
  }
}

export default Cursor;
