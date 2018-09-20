import React, { Component } from 'react';
import Debug from './core/Debug'
import Cursor from './core/Cursor'
import fsm from './fsm.js'
import Upload from './button/Upload'
import Download from './button/Download'
import Quadrants from './core/Quadrants'
import Help from './core/Help'

class SVGFrame extends Component {

  constructor(props) {
    super(props);
    this.state = {
      cursorPosX: 0,
      cursorPosY: 0,
      lastKey: '',
      frameNumber: 0,
      cursorTransform: '',
      showDebug: true,
      showHelp: true
    };

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
    this.timer = this.timer.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  onMouseMove(e) {
    this.setState({
      cursorPosX: e.pageX,
      cursorPosY: e.pageY,
      cursorTransform: 'translate(' + e.pageX + ',' + e.pageY + ')'
    });

    e.preventDefault();
  }

  onMouseWheel(e) {
    e.preventDefault();
  }

  onKeyDown(e) {
    this.setState({
      lastKey: e.key
    });

    if (e.key === 'd') {
      this.setState({
        showDebug: !this.state.showDebug
      });
    }

    e.preventDefault();
  }

  timer() {
    this.setState({
      frameNumber: this.state.frameNumber + 1
    });
  }

  onResize(e) {
     this.setState({
       frameWidth: window.innerWidth,
       frameHeight: window.innerHeight
     });
  }

  componentDidMount() {
     var intervalId = setInterval(this.timer, 17);
     this.setState({
       intervalId: intervalId,
       frameWidth: window.innerWidth,
       frameHeight: window.innerHeight
     });
     document.addEventListener('keydown', this.onKeyDown);
     window.addEventListener('resize', this.onResize)
  }

  render() {
    var frameStyle = {
      backgroundColor: '#ffffff',
      cursor: 'none'
    };
    return (
      <div className="SVGFrame">
        <svg  id="frame" style={frameStyle}
              height={this.state.frameHeight}
              width={this.state.frameWidth}
              onMouseMove={this.onMouseMove}
              onMouseDown={this.onMouseMove}
              onMouseUp={this.onMouseMove}
              onMouseEnter={this.onMouseMove}
              onMouseLeave={this.onMouseMove}
              onWheel={this.onMouseWheel}
              >
          <Debug {...this.state} />
          <Cursor transform={this.state.cursorTransform} />
          <Upload />
          <Download />
          <Quadrants {...this.state} />
          <Help showHelp={this.state.showHelp} y={0} x={this.state.frameWidth - 200} />
        </svg>
      </div>
    );
  }
}

export default SVGFrame;
