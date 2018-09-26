var util = require('./util.js');
var fsm = require('./fsm.js');
var hot_keys_fsm = require('./core/hotkeys.fsm.js');
var move_fsm = require('./fsm/move.fsm.js');
var group_fsm = require('./fsm/group.fsm.js');
var transition_fsm = require('./fsm/transition.fsm.js');
var time_fsm = require('./core/time.fsm.js');
var view_fsm = require('./core/view.fsm.js');
var buttons_fsm = require('./button/buttons.fsm.js');
var fsm_messages = require('./fsm/messages.js');
var core_messages = require('./core/messages.js');
var fsm_models = require('./fsm/models.js');
var button_models = require('./button/models.js');
var ReconnectingWebSocket = require('reconnectingwebsocket');
var history = require('history');



function ApplicationScope (svgFrame) {

  //bind functions
  this.select_items = this.select_items.bind(this);
  this.onMouseMove = this.onMouseMove.bind(this);
  this.onMouseUp = this.onMouseUp.bind(this);
  this.onMouseDown = this.onMouseDown.bind(this);
  this.onMouseWheel = this.onMouseWheel.bind(this);
  this.timer = this.timer.bind(this);
  this.onKeyDown = this.onKeyDown.bind(this);
  this.onResize = this.onResize.bind(this);
  this.onHistory = this.onHistory.bind(this);
  this.onDiagram = this.onDiagram.bind(this);
  this.onClientId =  this.onClientId.bind(this);
  this.onSnapshot =  this.onSnapshot.bind(this);
  this.update_offsets =  this.update_offsets.bind(this);
  this.updateScaledXY =  this.updateScaledXY.bind(this);
  this.updatePanAndScale =  this.updatePanAndScale.bind(this);
  this.update_channel_offsets =  this.update_channel_offsets.bind(this);
  this.send_control_message =  this.send_control_message.bind(this);
  this.send_trace_message =  this.send_trace_message.bind(this);
  this.uploadButtonHandler =  this.uploadButtonHandler.bind(this);
  this.downloadButtonHandler =  this.downloadButtonHandler.bind(this);

  var self = this;

  //Initialize variables
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
  this.showDebug = false;
  this.showHelp = true;
  this.showCursor = false;
  this.showButtons = true;
  this.states = [];
  this.transitions = [];
  this.selected_items = [];
  this.selected_states = [];
  this.selected_transitions = [];
  this.selected_groups = [];
  this.channels = [];
  this.groups = [];
  this.client_id = 1;
  this.state = this;
  this.diagram_id = 0;
  this.disconnected = process.env.REACT_APP_DISCONNECTED === 'true';
  this.websocket_host = process.env.REACT_APP_WEBSOCKET_HOST ? process.env.REACT_APP_WEBSOCKET_HOST : window.location.host;
  this.first_channel = null;
  this.history = [];
  this.selecting_state = false;
  this.browser_history = history.createHashHistory({hashType: "hashbang"});
  console.log(this.browser_history.location);

  var split = this.browser_history.location.pathname.split('/');
  var last = split[split.length - 1];
  var split2 = last.split(':');
  var last2 = split2[split2.length - 1];
  this.diagram_id = last2;


  //Connect websocket
  if (!this.disconnected) {
    console.log( "ws://" + this.websocket_host + "/ws/prototype?diagram_id=" + this.diagram_id);
    this.control_socket = new ReconnectingWebSocket(
      "ws://" + this.websocket_host + "/ws/prototype?diagram_id=" + this.diagram_id,
      null,
      {debug: false, reconnectInterval: 300});
    this.control_socket.onmessage = function(message) {
      if (self.first_channel !== null) {
        self.first_channel.send("Message", message);
      }
      console.log(message);
      self.svgFrame.forceUpdate();
    };
  } else {
    this.control_socket = {send: util.noop};
  }

  //Create sequences
  this.trace_order_seq = util.natural_numbers(0);
  this.state_id_seq = util.natural_numbers(0);
  this.transition_id_seq = util.natural_numbers(0);
  this.message_id_seq = util.natural_numbers(0);
  this.group_id_seq = util.natural_numbers(0);

  //Create Buttons
  this.buttons_by_name = {
    upload: new button_models.Button("UploadFSM", 20, 7, 50, 70, this.uploadButtonHandler, this),
    download: new button_models.Button("DownloadFSM", 80, 10, 50, 70, this.downloadButtonHandler, this),
  };

  this.buttons = [this.buttons_by_name.upload,
                  this.buttons_by_name.download];

  //Create FSM controllers
  this.hotkeys_controller = new fsm.FSMController(this, 'hot_keys_fsm', hot_keys_fsm.Start, this);
  this.move_controller = new fsm.FSMController(this, 'move_fsm', move_fsm.Start, this);
  this.group_controller = new fsm.FSMController(this, 'group_fsm', group_fsm.Start, this);
  this.transition_controller = new fsm.FSMController(this, 'transition_fsm', transition_fsm.Start, this);
  this.buttons_controller = new fsm.FSMController(this, 'buttons_fsm', buttons_fsm.Start, this);
  this.time_controller = new fsm.FSMController(this, 'time_fsm', time_fsm.Start, this);
  this.view_controller = new fsm.FSMController(this, 'view_fsm', view_fsm.Start, this);


  //Wire up controllers
  //
  this.controllers = [this.view_controller,
                      this.hotkeys_controller,
                      this.move_controller,
                      this.transition_controller,
                      this.group_controller,
                      this.buttons_controller,
                      this.time_controller];


  for (var i = 0; i < this.controllers.length - 1; i++) {
    var next_controller = this.controllers[i];
    var current_controller = this.controllers[i+1];

    current_controller.delegate_channel = new fsm.Channel(current_controller,
                                                          next_controller,
                                                          this);
  }

  this.first_channel = new fsm.Channel(null,
                                       this.controllers[this.controllers.length - 1],
                                       this);

}
exports.ApplicationScope = ApplicationScope;

ApplicationScope.prototype.uploadButtonHandler = function (message) {
  console.log(message);
  window.open("/prototype/upload?diagram_id=" + this.diagram_id, "_top");
};

ApplicationScope.prototype.downloadButtonHandler = function (message) {
  console.log(message);
  if (this.selected_groups.length === 1) {
      window.open("/prototype/download?diagram_id=" + this.diagram_id + "&finite_state_machine_id=" + this.selected_groups[0].id);
  } else {
      window.open("/prototype/download?diagram_id=" + this.diagram_id, "_blank");
  }
};

ApplicationScope.prototype.send_trace_message = function (message) {
  console.log(message);
};

ApplicationScope.prototype.send_control_message = function (message) {
  console.log(message);
  message.sender = this.client_id;
  message.message_id = this.message_id_seq();
  var data = core_messages.serialize(message);
  console.log(["Sending", message.msg_type, message.sender, message.message_id]);
  this.control_socket.send(data);
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
  });

  this.updateScaledXY();

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
  });

  this.updateScaledXY();

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
  });

  this.updateScaledXY();

  e.preventDefault();
  this.svgFrame.forceUpdate();
};

ApplicationScope.prototype.onMouseWheel = function (e) {
  //console.log(e);
  this.first_channel.send("MouseWheel", [e, e.deltaY]);
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

ApplicationScope.prototype.updateScaledXY = function() {
  this.scaledX = (this.mouseX - this.panX) / this.current_scale;
  this.scaledY = (this.mouseY - this.panY) / this.current_scale;
};

ApplicationScope.prototype.updatePanAndScale = function() {
  //var g = document.getElementById('frame_g');
  //g.setAttribute('transform','translate(' + this.panX + ',' + this.panY + ') scale(' + this.current_scale + ')');
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

ApplicationScope.prototype.onHistory = function (data) {

  this.history = [];
  var i = 0;
  for (i = 0; i < data.length; i++) {
      //console.log(data[i]);
      this.history.push(data[i]);
  }
};

ApplicationScope.prototype.onDiagram = function(data) {
  this.diagram_id = data.diagram_id;
  this.diagram_name = data.name;
  this.state_id_seq = util.natural_numbers(data.state_id_seq);
  this.transition_id_seq = util.natural_numbers(data.transition_id_seq);
  this.group_id_seq = util.natural_numbers(data.fsm_id_seq);
  this.channel_id_seq = util.natural_numbers(data.channel_id_seq);
  var path_data = {pathname: '/diagram_id:' + data.diagram_id}
  if (this.browser_history.location.pathname !== path_data.pathname) {
    this.browser_history.push(path_data);
  }
};

ApplicationScope.prototype.onClientId = function(data) {
  this.client_id = data;
};


ApplicationScope.prototype.onSnapshot = function (data) {

  console.log(data);

  //Erase the existing state
  this.states = [];
  this.transitions = [];
  this.groups = [];
  this.channels = [];

  var state_map = {};
  var fsm_map = {};
  var i = 0;
  var state = null;
  var new_state = null;
  var max_state_id = null;
  var max_transition_id = null;
  var min_x = null;
  var min_y = null;
  var max_x = null;
  var max_y = null;

  //Build the states
  for (i = 0; i < data.states.length; i++) {
      state = data.states[i];
      if (max_state_id === null || state.id > max_state_id) {
          max_state_id = state.id;
      }
      if (min_x === null || state.x < min_x) {
          min_x = state.x;
      }
      if (min_y === null || state.y < min_y) {
          min_y = state.y;
      }
      if (max_x === null || state.x > max_x) {
          max_x = state.x;
      }
      if (max_y === null || state.y > max_y) {
          max_y = state.y;
      }
      if (typeof(state_map[state.id]) === "undefined") {
          new_state = new fsm_models.State(state.id,
                                         state.label,
                                         state.x,
                                         state.y);
          this.states.push(new_state);
          state_map[state.id] = new_state;
      }
  }

  //Build the transitions
  var transition = null;
  for (i = 0; i < data.transitions.length; i++) {
      transition = data.transitions[i];
      if (max_transition_id === null || transition.id > max_transition_id) {
          max_transition_id = transition.id;
      }
      console.log(transition);
      this.transitions.push(new fsm_models.Transition(transition.id,
                                                    state_map[transition.from_state],
                                                    state_map[transition.to_state],
                                                    transition.label));
  }

  //Build the fsm
  var group = null;
var max_group_id = null;
  var new_group = null;
  for (i = 0; i < data.fsms.length; i++) {
      group = data.fsms[i];
      if (max_group_id === null || group.id > max_group_id) {
          max_group_id = group.id;
      }
      new_group = new fsm_models.Group(group.id,
                                   group.name,
                                   'fsm',
                                   group.x1,
                                   group.y1,
                                   group.x2,
                                   group.y2,
                                   false);
      this.groups.push(new_group);
      if (typeof(fsm_map[group.id]) === "undefined") {
          fsm_map[group.id] = new_group;
      }
  }

  //Update group membership

  for (i = 0; i < this.groups.length; i++) {
      this.groups[i].update_membership(this.states, this.groups);
  }


  //Build the channels
  var channel = null;
  for (i = 0; i < data.channels.length; i++) {
      channel = data.channels[i];
      if (max_transition_id === null || channel.id > max_transition_id) {
          max_transition_id = channel.id;
      }
      console.log(channel);
      this.channels.push(new fsm_models.Channel(channel.id,
                                              fsm_map[channel.from_fsm],
                                              fsm_map[channel.to_fsm],
                                              channel.label));
  }


  var diff_x;
  var diff_y;

  // Calculate the new scale to show the entire diagram
  if (min_x !== null && min_y !== null && max_x !== null && max_y !== null) {
      console.log(['min_x', min_x]);
      console.log(['min_y', min_y]);
      console.log(['max_x', max_x]);
      console.log(['max_y', max_y]);

      diff_x = max_x - min_x;
      diff_y = max_y - min_y;
      console.log(['diff_x', diff_x]);
      console.log(['diff_y', diff_y]);

      console.log(['ratio_x', window.innerWidth/diff_x]);
      console.log(['ratio_y', window.innerHeight/diff_y]);

      this.current_scale = Math.min(2, Math.max(0.10, Math.min((window.innerWidth-200)/diff_x, (window.innerHeight-300)/diff_y)));
      this.updateScaledXY();
      this.updatePanAndScale();
  }
  // Calculate the new panX and panY to show the entire diagram
  if (min_x !== null && min_y !== null) {
      console.log(['min_x', min_x]);
      console.log(['min_y', min_y]);
      diff_x = max_x - min_x;
      diff_y = max_y - min_y;
      this.panX = this.current_scale * (-min_x - diff_x/2) + window.innerWidth/2;
      this.panY = this.current_scale * (-min_y - diff_y/2) + window.innerHeight/2;
      this.updateScaledXY();
      this.updatePanAndScale();
  }

  //Update the state_id_seq to be greater than all state ids to prevent duplicate ids.
  if (max_state_id !== null) {
      console.log(['max_state_id', max_state_id]);
  }

  if (max_transition_id !== null) {
      console.log(['max_transition_id', max_transition_id]);
      this.transition_id_seq = util.natural_numbers(max_transition_id);
  }

  this.update_offsets();
  this.update_channel_offsets();
};

ApplicationScope.prototype.update_channel_offsets = function () {

  var i = 0;
  var channels = this.channels;
  var map = {};
  var channel = null;
  var key = null;
  for (i = 0; i < channels.length; i++) {
      channel = channels[i];
      key = "" + channel.from_fsm.id + "_" + channel.to_fsm.id;
      map[key] = 0;
  }
  for (i = 0; i < channels.length; i++) {
      channel = channels[i];
      key = "" + channel.from_fsm.id + "_" + channel.to_fsm.id;
      channel.offset = map[key];
      map[key] = channel.offset + 1;
  }
};
