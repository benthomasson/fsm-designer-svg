import React, { Component } from 'react';

import Colors from '../style/Colors'

class Debug extends Component {
  render() {
    var debugStyle = {
      stroke: 'rgb(77,200,242)',
      strokeWidth: 1
    };
    var debugRectStyle = {
      stroke: 'rgb(77,200,242)',
      fill: 'none'
    };
    var selectedStyle = {
      stroke: Colors['selectedBlue'],
      strokeWidth: 4
    };
    var stateCircleStyle = {
      fill: Colors['widgetBody'],
      stroke: Colors['darkWidgetDetail'],
      strokeWidth: 2,
      cursor: 'pointer'
    };
    if (this.props.moving) {
      stateCircleStyle.cursor = 'move';
    }
    return (
      <g transform={'translate(' + this.props.x + ',' + this.props.y + ')'}>
        {this.props.showDebug ?
         <g>
           <line x1={-50 - 10}
                 y1="0"
                 x2={50 + 10}
                 y2="0"
                 style={debugStyle} />
           <line x1="0"
                 y1={-50 - 10}
                 x2="0"
                 y2={50 + 10}
                 style={debugStyle} />
           <rect x="-50"
                 y="-50"
                 width={50 * 2}
                 height={50 * 2}
                 style={debugRectStyle} />
         </g>
        : null}
        {this.props.selected ?
        <circle
            cx="0"
            cy="0"
            r={50 + 2}
            style={selectedStyle}>
        </circle>
        : null}
        <circle
            cx="0"
            cy="0"
            r="50"
            style={stateCircleStyle}>
        </circle>
        <text textAnchor="middle" x="0" y="0">{this.props.label}</text>
      </g>
    );
  }
}

export default Debug;
