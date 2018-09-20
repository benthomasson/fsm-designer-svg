import React, { Component } from 'react';

class Debug extends Component {
  render() {
    var debugStyle = {
      fill: 'rgb(77,200,242)',
      stroke: 'none'
    };
    var i = -1;
    function next_i () {
      i = i + 1;
      return 100 + i * 20;
    }
    if (this.props.showDebug) {
      return (
        <g>
          <text x="100" y={next_i()} style={debugStyle}>Page: ({this.props.frameWidth}, {this.props.frameHeight})</text>
          <text x="100" y={next_i()} style={debugStyle}>Cursor: ({this.props.cursorPosX}, {this.props.cursorPosY})</text>
          <text x="100" y={next_i()} style={debugStyle}>Key: {this.props.lastKey} </text>
          <text x="100" y={next_i()} style={debugStyle}>Frame #: {this.props.frameNumber} </text>
        </g>
      );
    } else {
      return null;
    }
  }
}

export default Debug;
