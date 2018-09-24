var util = require('./util.js');
var fsm = require('./fsm.js');
var hot_keys_fsm = require('./core/hotkeys.fsm.js');
var move_fsm = require('./fsm/move.fsm.js');
var transition_fsm = require('./fsm/transition.fsm.js');
var fsm_messages = require('./fsm/messages.js');

function ApplicationScope (svgFrame) {

  this.svgFrame = svgFrame;
  this.panX = 0;
  this.panY = 0;
  this.current_scale = 1.0;
  this.cursorPosX = 0;
  this.cursorPosY = 0;
  this.mouseX = 0;
  this.mouseY = 0;
  this.scaledX = 0;
  this.scaledY = 0;
  this.pressedX = 0;
  this.pressedY = 0;
  this.pressedScaledX = 0;
  this.pressedScaledY = 0;
  this.frameWidth = 0;
  this.frameHeight = 0;
  this.lastKey = '';
  this.frameNumber = 0;
  this.showDebug = true;
  this.showHelp = true;
  this.showCursor = false;
  this.states = [];
  this.transitions = [];
  this.selected_items = [];
  this.selected_states = [];
  this.selected_transitions = [];
  this.channels = [];
  this.groups = [];
  this.client_id = 1;
  this.state = this;

  this.trace_order_seq = util.natural_numbers(0);
  this.state_id_seq = util.natural_numbers(0);
  this.transition_id_seq = util.natural_numbers(0);

  this.hotkeys_controller = new fsm.FSMController(this, 'hot_keys_fsm', hot_keys_fsm.Start, this);
  this.move_controller = new fsm.FSMController(this, 'move_fsm', move_fsm.Start, this);
  this.transition_controller = new fsm.FSMController(this, 'transition_fsm', transition_fsm.Start, this);

  this.move_controller.delegate_channel = new fsm.Channel(this.move_controller,
                                                          this.hotkeys_controller,
                                                          this);

  this.transition_controller.delegate_channel = new fsm.Channel(this.transition_controller,
                                                                this.move_controller,
                                                                this);

  this.first_channel = new fsm.Channel(null,
                                       this.transition_controller,
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
exports.ApplicationScope = ApplicationScope;

ApplicationScope.prototype.send_trace_message = function (message) {
  console.log(message);
};

ApplicationScope.prototype.send_control_message = function (message) {
  console.log(message);
};

ApplicationScope.prototype.setState = function (o) {
  var keys = Object.keys(o);

  for (var i = 0; i < keys.length; i++) {
    this[keys[i]] = o[keys[i]];
  }
};

ApplicationScope.prototype.onMouseMove = function (e) {
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
  this.svgFrame.forceUpdate();
};

ApplicationScope.prototype.onMouseDown = function (e) {
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
  this.svgFrame.forceUpdate();
};

ApplicationScope.prototype.onMouseUp = function (e) {
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
  this.svgFrame.forceUpdate();
};

ApplicationScope.prototype.onMouseWheel = function (e) {
  e.preventDefault();
  this.svgFrame.forceUpdate();
};

ApplicationScope.prototype.onKeyDown = function (e) {
  this.first_channel.send('KeyDown', e);
  this.setState({
    lastKey: e.key
  });

  e.preventDefault();
  this.svgFrame.forceUpdate();
};

ApplicationScope.prototype.timer = function () {
  this.setState({
    frameNumber: this.state.frameNumber + 1
  });
  this.svgFrame.forceUpdate();
};

ApplicationScope.prototype.onResize = function (e) {
   this.setState({
     frameWidth: window.innerWidth,
     frameHeight: window.innerHeight
   });
  this.svgFrame.forceUpdate();
};

ApplicationScope.prototype.clear_selections = function () {

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
};

ApplicationScope.prototype.select_items = function (multiple_selection) {

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

ApplicationScope.prototype.update_offsets = function () {

  var i = 0;
  var transitions = this.state.transitions;
  var map = {};
  var transition = null;
  var key = null;
  for (i = 0; i < transitions.length; i++) {
      transition = transitions[i];
      key = "" + transition.from_state.id + "_" + transition.to_state.id;
      map[key] = 0;
  }
  for (i = 0; i < transitions.length; i++) {
      transition = transitions[i];
      key = "" + transition.from_state.id + "_" + transition.to_state.id;
      transition.offset = map[key];
      map[key] = transition.offset + 1;
  }
};
