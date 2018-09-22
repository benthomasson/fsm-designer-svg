import React, { Component } from 'react';
import Debug from './core/Debug'
import Cursor from './core/Cursor'
import fsm from './fsm.js'
import Upload from './button/Upload'
import Download from './button/Download'
import Quadrants from './core/Quadrants'
import State from './fsm/State'
import Help from './core/Help'
import hot_keys_fsm from './core/hotkeys.fsm'
import move_fsm from './fsm/move.fsm'
import util from './util'
import fsm_messages from './fsm/messages'


class SVGFrame extends Component {

  constructor(props) {
    super(props);
    this.state = {
      panX: 0,
      panY: 0,
      current_scale: 1.0,
      cursorPosX: 0,
      cursorPosY: 0,
      mouseX: 0,
      mouseY: 0,
      scaledX: 0,
      scaledY: 0,
      pressedX: 0,
      pressedY: 0,
      pressedScaledX: 0,
      pressedScaledY: 0,
      frameWidth: 0,
      frameHeight: 0,
      lastKey: '',
      frameNumber: 0,
      showDebug: true,
      showHelp: true,
      showCursor: false,
      states: [],
      transitions: [],
      selected_items: [],
      selected_states: [],
      selected_transitions: [],
      channels: [],
      groups: [],
      client_id: 1
    };

    this.trace_order_seq = util.natural_numbers(0);
    this.state_id_seq = util.natural_numbers(0);

    this.hotkeys_controller = new fsm.FSMController(this, 'hot_keys_fsm', hot_keys_fsm.Start, this);
    this.move_controller = new fsm.FSMController(this, 'move_fsm', move_fsm.Start, this);

    this.move_controller.delegate_channel = new fsm.Channel(this.move_controller,
                                                            this.hotkeys_controller,
                                                            this);

    this.first_channel = new fsm.Channel(null,
                                         this.move_controller,
                                         this);

    this.select_items = this.select_items.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
    this.timer = this.timer.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  send_trace_message (message) {
    console.log(message);
  }

  send_control_message (message) {
    console.log(message);
  }

  onMouseMove(e) {
    this.first_channel.send('MouseMove', e);
    this.setState({
      cursorPosX: e.pageX,
      cursorPosY: e.pageY,
      mouseX: e.pageX,
      mouseY: e.pageY,
      scaledX: e.pageX,
      scaledY: e.pageY,
    });

    e.preventDefault();
  }

  onMouseDown(e) {
    this.first_channel.send('MouseDown', e);
    this.setState({
      cursorPosX: e.pageX,
      cursorPosY: e.pageY,
      mouseX: e.pageX,
      mouseY: e.pageY,
      scaledX: e.pageX,
      scaledY: e.pageY,
    });

    e.preventDefault();
  }

  onMouseUp(e) {
    this.first_channel.send('MouseUp', e);
    this.setState({
      cursorPosX: e.pageX,
      cursorPosY: e.pageY,
      mouseX: e.pageX,
      mouseY: e.pageY,
      scaledX: e.pageX,
      scaledY: e.pageY,
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
     //var intervalId = setInterval(this.timer, 17);
     var intervalId = null;
     this.setState({
       intervalId: intervalId,
       frameWidth: window.innerWidth,
       frameHeight: window.innerHeight
     });
     document.addEventListener('keydown', this.onKeyDown);
     window.addEventListener('resize', this.onResize)
  }

  clear_selections () {

    var i = 0;
    var states = this.state.states;
    var transitions = this.state.transitions;
    var groups = this.state.groups;
    var channels = this.state.channels;
    for (i = 0; i < states.length; i++) {
        if (states[i].selected) {
            this.send_control_message(new fsm_messages.StateUnSelected(this.state.client_id, states[i].id));
        }
        states[i].selected = false;
    }
    for (i = 0; i < transitions.length; i++) {
        if (transitions[i].selected) {
            this.send_control_message(new fsm_messages.TransitionUnSelected(this.state.client_id, transitions[i].id));
        }
        transitions[i].selected = false;
    }
    for (i = 0; i < channels.length; i++) {
        if (channels[i].selected) {
            this.send_control_message(new fsm_messages.ChannelUnSelected(this.state.client_id, channels[i].id));
        }
        channels[i].selected = false;
    }
    for(i = 0; i < groups.length; i++) {
        if (groups[i].selected) {
            this.send_control_message(new fsm_messages.GroupUnSelected(this.state.client_id, groups[i].id));
        }
        groups[i].selected = false;
    }
    this.setState({
      selected_items: [],
      selected_states: [],
      selected_transitions: [],
      selected_groups: [],
      selected_channels: []
    });
  }

  select_items (multiple_selection) {

        var i = 0;
        var states = this.state.states;
        var last_selected_state = null;
        var last_selected_transition = null;
        var selected_items = [];
        var selected_states = [];
        var selected_transitions = [];

        this.setState({
          pressedX: this.state.mouseX,
          pressedY: this.state.mouseY,
          pressedScaledX: this.state.scaledX,
          pressedScaledY: this.state.scaledY
        });

        if (multiple_selection) {
          selected_items = this.state.selected_items.slice();
          selected_states = this.state.selected_states.slice();
          selected_transitions = this.state.selected_transitions.slice();
        } else {
            this.clear_selections();
        }

        for (i = states.length - 1; i >= 0; i--) {
            if (states[i].is_selected(this.state.scaledX, this.state.scaledY)) {
                this.send_control_message(new fsm_messages.StateSelected(this.state.client_id, states[i].id));
                last_selected_state = states[i];
                last_selected_state.selected = true;
                if (selected_items.indexOf(states[i]) === -1) {
                    selected_items.push(states[i]);
                }
                if (selected_states.indexOf(states[i]) === -1) {
                    selected_states.push(states[i]);
                }
                if (!multiple_selection) {
                    break;
                }
            }
        }

        // Do not select links if a state was selected
        if (last_selected_state === null) {
            for (i = 0; i < this.state.transitions.length; i++) {
                if(this.state.transitions[i].is_selected(this.state.scaledX, this.state.scaledY)) {
                    this.send_control_message(new fsm_messages.TransitionSelected(this.state.client_id, this.state.transitions[i].id));
                    last_selected_transition = this.state.transitions[i];
                    last_selected_transition.selected = true;
                    if (selected_items.indexOf(this.state.transitions[i]) === -1) {
                        selected_items.push(this.state.transitions[i]);
                    }
                    if (selected_transitions.indexOf(this.state.transitions[i]) === -1) {
                        selected_transitions.push(this.state.transitions[i]);
                        if (!multiple_selection) {
                            break;
                        }
                    }
                }
            }
        }

        this.setState({
          selected_items: selected_items,
          selected_states: selected_states,
          selected_transitions: selected_transitions
        });
        return {last_selected_state: last_selected_state,
                last_selected_transition: last_selected_transition};
  };

  render() {
    var frameStyle = {
      backgroundColor: '#ffffff',
    };
    var states = [];
    for (var i=0; i< this.state.states.length; i++) {
      states.push(<State {...this.state.states[i]} key={'state' + i} showDebug={this.state.showDebug}/>);
    }
    return (
      <div className='SVGFrame'>
        <svg  id='frame' style={frameStyle}
              height={this.state.frameHeight}
              width={this.state.frameWidth}
              onMouseMove={this.onMouseMove}
              onMouseDown={this.onMouseDown}
              onMouseUp={this.onMouseUp}
              onWheel={this.onMouseWheel}
              >
          {states}
          <Debug {...this.state} x={100} move={this.move_controller}/>
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
