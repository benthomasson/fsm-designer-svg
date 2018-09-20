import React, { Component } from 'react';
import Debug from './core/Debug'
import Cursor from './core/Cursor'
import fsm from './fsm.js'
import Upload from './button/Upload'
import Download from './button/Download'
import Quadrants from './core/Quadrants'
import Help from './core/Help'
import hot_keys_fsm from './core/hotkeys.fsm'
import util from './util'


class SVGFrame extends Component {

  constructor(props) {
    super(props);
    this.state = {
      panX: 0,
      panY: 0,
      current_scale: 1.0,
      cursorPosX: 0,
      cursorPosY: 0,
      frameWidth: 0,
      frameHeight: 0,
      lastKey: '',
      frameNumber: 0,
      cursorTransform: '',
      showDebug: true,
      showHelp: true,
      showCursor: true
    };

    this.trace_order_seq = util.natural_numbers(0);

    this.hot_keys_fsm = new fsm.FSMController(this, "hot_keys_fsm", hot_keys_fsm.Start, this);

    this.first_channel = new fsm.Channel(null,
                                         this.hot_keys_fsm,
                                         this);

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
    this.timer = this.timer.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  send_trace_message (message) {
    console.log(message);
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
    this.first_channel.send('KeyDown', e);
    this.setState({
      lastKey: e.key
    });

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
          <Cursor x={this.state.cursorPosX} y={this.state.cursorPosY} showCursor={this.state.showCursor}/>
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
