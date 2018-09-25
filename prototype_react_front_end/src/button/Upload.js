import React, { Component } from 'react';

import Colors from '../style/Colors';
import {textStyle, pathStyle} from '../style/Styles.js'

class Upload extends Component {
  render() {
    return (
        <g style={{cursor: 'pointer'}}>
          <g transform="translate(190, 7) scale(0.025)">
          <path style={pathStyle} d="M1344 1472q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm256 0q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128-224v320q0 40-28 68t-68 28h-1472q-40 0-68-28t-28-68v-320q0-40 28-68t68-28h427q21 56 70.5 92t110.5 36h256q61 0 110.5-36t70.5-92h427q40 0 68 28t28 68zm-325-648q-17 40-59 40h-256v448q0 26-19 45t-45 19h-256q-26 0-45-19t-19-45v-448h-256q-42 0-59-40-17-39 14-69l448-448q18-19 45-19t45 19l448 448q31 30 14 69z"/>
          </g>
          <g transform="translate(215, 70)"><text style={textStyle} textAnchor="middle">FSM</text></g>
        </g>
    );
  }
}

export default Upload;
