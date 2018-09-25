import React, { Component } from 'react';
import Debug from './core/Debug'
import Cursor from './core/Cursor'
import Upload from './button/Upload'
import Download from './button/Download'
import Quadrants from './core/Quadrants'
import State from './fsm/State'
import Group from './fsm/Group'
import Transition from './fsm/Transition'
import Help from './core/Help'
import models from './models'


class SVGFrame extends Component {

  constructor(props) {
    super(props);
    window.scope = this;
    this.scope = new models.ApplicationScope(this);
  }

  componentDidMount() {
     //var intervalId = setInterval(this.scope.timer, 17);
     var intervalId = null;
     this.scope.setState({
       intervalId: intervalId,
       frameWidth: window.innerWidth,
       frameHeight: window.innerHeight
     });
     document.addEventListener('keydown', this.scope.onKeyDown);
     window.addEventListener('resize', this.scope.onResize)

     this.forceUpdate();
  }

  render() {
    var frameStyle = {
      backgroundColor: '#ffffff',
    };
    var states = [];
    for (var i=0; i< this.scope.states.length; i++) {
      states.push(<State {...this.scope.states[i]} key={'state' + i} showDebug={this.scope.showDebug}/>);
    }
    var transitions = [];
    for (i=0; i< this.scope.transitions.length; i++) {
      transitions.push(<Transition {...this.scope.transitions[i]}
                                   key={'transition' + i}
                                   showDebug={this.scope.showDebug}
                                   scaledX={this.scope.scaledX}
                                   scaledY={this.scope.scaledY} />);
    }
    var groups = [];
    for (i=0; i< this.scope.groups.length; i++) {
      groups.push(<Group {...this.scope.groups[i]}
                          key={'group' + i}
                          showDebug={this.scope.showDebug}
                          scaledX={this.scope.scaledX}
                          scaledY={this.scope.scaledY} />);
    }
    return (
      <div className='SVGFrame'>
        <svg  id='frame' style={frameStyle}
              height={this.scope.frameHeight}
              width={this.scope.frameWidth}
              onMouseMove={this.scope.onMouseMove}
              onMouseDown={this.scope.onMouseDown}
              onMouseUp={this.scope.onMouseUp}
              onWheel={this.scope.onMouseWheel}>
          <defs>
            <filter x="0" y="0" width="1" height="1" id="selected">
              <feFlood floodColor="#b3d8fd"/>
              <feComposite in="SourceGraphic" operator="xor"/>
            </filter>
          </defs>
          <g transform={'translate(' + this.scope.panX + ',' + this.scope.panY + ') ' +
                         'scale(' + this.scope.current_scale + ')'}>
          {transitions}
          {states}
          {groups}
          <Quadrants {...this.scope} />
          </g>
          <Debug {...this.scope}
                 x={100}
                 move={this.scope.move_controller}
                 transition={this.scope.transition_controller}
                 view={this.scope.view_controller}
                 group={this.scope.group_controller}
                 />
          <Cursor x={this.scope.cursorPosX}
                  y={this.scope.cursorPosY}
                  showCursor={this.scope.showCursor}/>
          <Upload x={20} y={7}/>
          <Download x={80} y={10}/>
          <Help showHelp={this.scope.showHelp}
                y={0}
                x={this.scope.frameWidth - 200} />
        </svg>
      </div>
    );
  }
}

export default SVGFrame;
