import React, { Component } from 'react';

import Colors from '../style/Colors'

class Transition extends Component {

  slope () {
      //Return the slope in degrees for this transition.
      var x1 = this.props.from_state.x;
      var y1 = this.props.from_state.y;
      var x2 = this.props.to_state.x;
      var y2 = this.props.to_state.y;
      return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 180;
  };

  length () {
      //Return the length of this transition.
      var x1 = this.props.from_state.x;
      var y1 = this.props.from_state.y;
      var x2 = this.props.to_state.x;
      var y2 = this.props.to_state.y;
      return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
  };

  arc_offset2 () {
      var r = this.arc_r2();
      var theta = Math.acos((this.length() / 2) / r);
      var offset =  r * (1 - Math.sin(theta));
      return offset;
  };

  arc_r2 () {
      var offset_to_r = [2, 1, 0.75, 0.6, 0.55, 0.53, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
      return this.length() * offset_to_r[this.props.offset];
  };

  start_arc_angle_rad () {
      return Math.acos((this.props.from_state.size / 2) / this.arc_r2()) - Math.acos((this.length()/2)/this.arc_r2());
  };

  start_arc_angle () {
      return this.start_arc_angle_rad() * 180 / Math.PI;
  };

  end_arc_angle_rad () {
      var r = this.arc_r2();
      var l = this.length();
      return Math.acos((this.props.to_state.size / 2) / r) - Math.acos((l/2)/r);
  };

  end_arc_angle () {
      return this.end_arc_angle_rad() * 180 / Math.PI;
  };

  arc_angle_tan_rad2 () {
      var r = this.arc_r2();
      var l = this.length();
      var phi = this.end_arc_angle_rad();
      return Math.PI/2 - Math.acos((l/2 - Math.cos(phi) * this.props.to_state.size) / r);
  };

  arc_angle_tan2 () {
      return this.arc_angle_tan_rad2() * 180 / Math.PI;
  };

  flip_text_rotate () {
      var slope = this.slope();
      if (slope > 90 && slope < 270) {
          return 180;
      } else {
          return 0;
      }
  };

  flip_text_offset () {
      var slope = this.slope();
      if (slope > 90 && slope < 270) {
          return 10;
      } else {
          return 0;
      }
  };
  render() {
    var debugLineStyle = {
      stroke: Colors['debugCopyNot'],
      strokeWidth: 1
    };
    var transitionStyle = {
      stroke: Colors['transition'],
      strokeWidth: 2,
      fill: 'none',
      cursor: 'text'
    };
    var debugCircleStyle = {
      fill: Colors['debugCopyNot'],
    }
    var debugRectStyle = {
      stroke: Colors['debugCopyNot'],
      fill: 'none'
    }
    var arrowStyle = {
      stroke: Colors['darkWidgetDetail'],
      fill: Colors['darkWidgetDetail']
    }

    var transitionTextStyle = {
      fill: Colors['darkWidgetDetail']
    };

    var labelStyle = {
      cursor: 'text',
      fillOpacity: 0
    }

    var arrowSelectedStyle = {
      fill: Colors['selectedBlue'],
      stroke: Colors['selectedBlue']
    };

    var selectedTransitionStyle = {
      fill: 'none',
      stroke: Colors['selectedBlue'],
      strokeWidth: 6
    };
    return (
    <g>
      {this.props.showDebug ?
      <line x1={this.props.from_state.x}
            y1={this.props.from_state.y}
            x2={this.props.to_state !== null ? this.props.to_state.x : this.props.scaledX}
            y2={this.props.to_state !== null ? this.props.to_state.y : this.props.scaledY}
            style={debugLineStyle}>
      </line>
      : null}
      {this.props.to_state === null ?
      <line x1={this.props.from_state.x}
            y1={this.props.from_state.y}
            x2={this.props.to_state !== null ? this.props.to_state.x : this.props.scaledX}
            y2={this.props.to_state !== null ? this.props.to_state.y : this.props.scaledY}
            style={transitionStyle}>
      </line>
      : null}
      {(this.props.to_state !== null && this.props.to_state !== this.props.from_state) ?
      <g transform={"translate(" + this.props.from_state.x + ',' +
                                   this.props.from_state.y + ')' +
                    'rotate(' + this.slope() + ")"}>
      {this.props.selected ?
        <path style={selectedTransitionStyle} d={"M0 0 A " + this.arc_r2() + ' ' + this.arc_r2() +' 0 0 0 ' + -this.length() + " 0"}></path>
      : null}
      <path style={transitionStyle} d={"M0 0 A " + this.arc_r2() + ' ' + this.arc_r2() +' 0 0 0 ' + -this.length() + " 0"}></path>
      {this.props.showDebug ?
      <g>
      <circle cx={-this.length()/2}
              cy={-this.arc_offset2()}
              r='10'
              style={debugCircleStyle}></circle>
      <line x1={-this.length()/2}
            y1="0"
            x2={-this.length()/2}
            y2={-this.arc_offset2()}
            style={debugLineStyle}></line>
      <g transform={"rotate(" + this.start_arc_angle() + ")" +
                    "translate(" + -this.props.from_state.size + ", 0)"}>
      <circle cx="0"
              cy="0"
              r="10"
              style={debugCircleStyle} ></circle>
      </g>
      <rect x={-this.length()}
            y={-this.arc_offset2()}
            width={this.length()}
            height={this.arc_offset2()}
            style={debugRectStyle}></rect>
      </g>
      : null}
      </g>
      : null}
      {(this.props.to_state !== null && this.props.to_state !== this.props.from_state) ?
        <g transform={"translate(" + this.props.to_state.x + "," + this.props.to_state.y + ")" +
                     "rotate(" + this.slope() + ")" +
                     "rotate(" + -this.end_arc_angle() + ")" +
                     "translate(" + this.props.to_state.size + ", 0)" +
                     "rotate(" + this.end_arc_angle() + ")" +
                     "rotate(180)" +
                     "rotate(" + -this.arc_angle_tan2() + ")" }>
        {(this.props.showDebug) ?
        <line x1="0"
              y1="0"
              x2="-100"
              y2="0"
              style={debugLineStyle}></line>
         : null}
          <g transform="translate(-19, -9)">
            {this.props.selected ?
             <path transform="translate(-2, -3)" d="M0,0 L0,24 L24,12 z" style={arrowSelectedStyle}/>
            : null}
            <path d="M0,0 L0,18 L18,9 z" style={arrowStyle}/>
          </g>
        </g>
      : null}
      {(this.props.to_state !== null && this.props.to_state !== this.props.from_state) ?
        <g transform={"translate(" + this.props.from_state.x + "," + this.props.from_state.y + ")" +
                     "rotate(" + this.slope() + ")" +
                     "translate(" + -this.length()/2 + ", 0)" +
                     "translate(0," + -this.arc_offset2() + ")" +
                     "translate(0, -5)" +
                     "rotate(" + this.flip_text_rotate() + ")" +
                     "translate( 0," + this.flip_text_offset() + ") "}>
        <rect style={labelStyle} x="-30" y="-20" width="60" height="30"/>
        {(this.props.selected && !this.props.edit_label) ?
        <text style={transitionTextStyle}
              filter="url(#selected)"
              textAnchor="middle"
              x="0"
              y="0">{this.props.label}</text>
        : null}
        <text style={transitionTextStyle} textAnchor="middle" x="0" y="0">{this.props.label}{this.props.edit_label ? '_' : ''}</text>
        </g>
      : null}
    </g>
    );
  }
}

export default Transition;
