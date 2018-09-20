import React, { Component } from 'react';
import Debug from './Debug'
import Cursor from './Cursor'
import fsm from './fsm'

class SVGFrame extends Component {

  constructor(props) {
    super(props);
    this.state = {
      cursorPosX: 0,
      cursorPosY: 0,
      lastKey: '',
      frameNumber: 0,
      cursorTransform: '',
      showDebug: true
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
        <svg id="frame" style={frameStyle}
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
        </svg>
      </div>
    );
  }
}

export default SVGFrame;
