import React, { Component } from 'react';

import Colors from '../style/Colors';

class Upload extends Component {
  render() {
    var quadrantStyle = {
      stroke: Colors['debugCopyNot'],
      strokeWidth: 1
    };
    var i = -1;
    function next_i () {
      i = i + 1;
      return 20 + i * 20;
    }
    return (
        this.props.showHelp ?
          <g transform={'translate(' + this.props.x + ',' + this.props.y + ')'}>
              <text x='0' y={next_i()}>Hot Keys:</text>
              <text x='0' y={next_i()}>h - Toggle help</text>
              <text x='0' y={next_i()}>d - Toggle debug</text>
              <text x='0' y={next_i()}>p - Toggle pointer</text>
              <text x='0' y={next_i()}>b - Toggle buttons</text>
              <text x='0' y={next_i()}>s - New state</text>
              <text x='0' y={next_i()}>t - New transition</text>
              <text x='0' y={next_i()}>f - New FSM</text>
              <text x='0' y={next_i()}>c - New channel</text>
              <text x='0' y={next_i()}>0 - Reset scale and pan</text>
              <text x='0' y={next_i()}>Space - Toggle Pause</text>
              <text x='0' y={next_i()}>r - Restart replay</text>
              <text x='0' y={next_i()}>j - Step replay back</text>
              <text x='0' y={next_i()}>k - Step replay forward</text>
          </g>
      : null
    );
  }
}

export default Upload;
