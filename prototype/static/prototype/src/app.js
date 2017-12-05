
//console.log = function () { };
var app = angular.module('triangular', ['monospaced.mousewheel']);
var fsm = require('./fsm.js');
var view = require('./view.js');
var move = require('./move.js');
var hotkeys_fsm = require('./hotkeys.fsm.js');
var transition = require('./transition.js');
var buttons = require('./buttons.js');
var time = require('./time.js');
var util = require('./util.js');
var models = require('./models.js');
var messages = require('./messages.js');

app.controller('MainCtrl', function($scope, $document, $location, $window, $http) {

  window.scope = $scope;

  $scope.finite_state_machine_id = $location.search().finite_state_machine_id || 0;
  $scope.replay_id = $location.search().replay_id || 0;
  $scope.replay_data = [];
  // Create a web socket to connect to the backend server
  $scope.control_socket = new window.ReconnectingWebSocket("ws://" + window.location.host + "/prototype?finite_state_machine_id=" + $scope.finite_state_machine_id,
                                                           null,
                                                           {debug: false, reconnectInterval: 300});
  $scope.location = $location;
  $scope.history = [];
  $scope.frame = 0;
  $scope.client_id = 0;
  $scope.client_id = 0;
  $scope.onMouseDownResult = "";
  $scope.onMouseUpResult = "";
  $scope.onMouseEnterResult = "";
  $scope.onMouseLeaveResult = "";
  $scope.onMouseMoveResult = "";
  $scope.onMouseMoveResult = "";
  $scope.current_scale = 1.0;
  $scope.quadrant_rotation = 0;
  $scope.debug_points = [];
  $scope.panX = 0;
  $scope.panY = 0;
  $scope.mouseX = 0;
  $scope.mouseY = 0;
  $scope.scaledX = 0;
  $scope.scaledY = 0;
  $scope.pressedX = 0;
  $scope.pressedY = 0;
  $scope.pressedScaledX = 0;
  $scope.pressedScaledY = 0;
  $scope.lastPanX = 0;
  $scope.lastPanY = 0;
  $scope.selected_items = [];
  $scope.selected_states = [];
  $scope.selected_transitions = [];
  $scope.new_transition = null;
  //Define the FSMs
  $scope.hotkeys_controller = new fsm.FSMController($scope, 'hotkeys_fsm', hotkeys_fsm.Start, $scope);
  $scope.view_controller = new fsm.FSMController($scope, 'view_fsm', view.Start, $scope);
  $scope.move_controller = new fsm.FSMController($scope, 'move_fsm', move.Start, $scope);
  $scope.transition_controller = new fsm.FSMController($scope, 'transition_fsm', transition.Start, $scope);
  $scope.buttons_controller = new fsm.FSMController($scope, 'buttons_fsm', buttons.Start, $scope);
  $scope.time_controller = new fsm.FSMController($scope, 'time_fsm', time.Start, $scope);

  //Wire up the FSMs
  $scope.view_controller.delegate_channel = new fsm.Channel($scope.view_controller,
                                                            $scope.hotkeys_controller,
                                                            $scope);
  $scope.move_controller.delegate_channel = new fsm.Channel($scope.move_controller,
                                                            $scope.view_controller,
                                                            $scope);
  $scope.transition_controller.delegate_channel = new fsm.Channel($scope.transition_controller,
                                                                  $scope.move_controller,
                                                                  $scope);
  $scope.buttons_controller.delegate_channel = new fsm.Channel($scope.buttons_controller,
                                                               $scope.transition_controller,
                                                               $scope);
  $scope.time_controller.delegate_channel = new fsm.Channel($scope.time_controller,
                                                            $scope.buttons_controller,
                                                            $scope);
  $scope.first_channel = new fsm.Channel(null,
                                         $scope.time_controller,
                                         $scope);
  $scope.last_key = "";
  $scope.last_key_code = null;
  $scope.last_event = null;
  $scope.cursor = {'x':100, 'y': 100, 'hidden': false};

  $scope.debug = {'hidden': true};
  $scope.hide_buttons = false;
  $scope.graph = {'width': window.innerWidth,
                  'right_column': window.innerWidth - 300,
                  'height': window.innerHeight};
  $scope.state_id_seq = util.natural_numbers(0);
  $scope.message_id_seq = util.natural_numbers(0);
  $scope.transition_id_seq = util.natural_numbers(0);
  $scope.trace_id_seq = util.natural_numbers(0);
  $scope.trace_id = $scope.trace_id_seq();
  $scope.time_pointer = -1;
  $scope.frame = 0;
  $scope.client_messages = {};
  $scope.out_of_order_messages = {};


  $scope.states = [
  ];

  $scope.stencils = [
  ];

  $scope.layers = [
  ];

  $scope.transitions = [
  ];



    // Utility functions

    // Accepts a MouseEvent as input and returns the x and y
    // coordinates relative to the target element.
    var getCrossBrowserElementCoords = function (mouseEvent)
    {
      var result = {
        x: 0,
        y: 0
      };

      if (!mouseEvent)
      {
        mouseEvent = window.event;
      }

      if (mouseEvent.pageX || mouseEvent.pageY)
      {
        result.x = mouseEvent.pageX;
        result.y = mouseEvent.pageY;
      }
      else if (mouseEvent.clientX || mouseEvent.clientY)
      {
        result.x = mouseEvent.clientX + document.body.scrollLeft +
          document.documentElement.scrollLeft;
        result.y = mouseEvent.clientY + document.body.scrollTop +
          document.documentElement.scrollTop;
      }

      return result;
    };

    var getMouseEventResult = function (mouseEvent) {
      var coords = getCrossBrowserElementCoords(mouseEvent);
      return "(" + coords.x + ", " + coords.y + ")";
    };

    $scope.updateScaledXY = function() {
        $scope.scaledX = ($scope.mouseX - $scope.panX) / $scope.current_scale;
        $scope.scaledY = ($scope.mouseY - $scope.panY) / $scope.current_scale;
    };

    $scope.updatePanAndScale = function() {
        var g = document.getElementById('frame_g');
        g.setAttribute('transform','translate(' + $scope.panX + ',' + $scope.panY + ') scale(' + $scope.current_scale + ')');
    };

    $scope.update_offsets = function () {

        var i = 0;
        var transitions = $scope.transitions;
        var map = new Map();
        var transition = null;
        var key = null;
        for (i = 0; i < transitions.length; i++) {
            transition = transitions[i];
            key = "" + transition.from_state.id + "_" + transition.to_state.id;
            map.set(key, 0);
        }
        for (i = 0; i < transitions.length; i++) {
            transition = transitions[i];
            key = "" + transition.from_state.id + "_" + transition.to_state.id;
            transition.offset = map.get(key);
            map.set(key, transition.offset + 1);
        }
    };

    $scope.clear_all_selections = function () {

        var i = 0;
        var states = $scope.states;
        var transitions = $scope.transitions;
        $scope.selected_items = [];
        $scope.selected_states = [];
        $scope.selected_transitions = [];
        for (i = 0; i < states.length; i++) {
            if (states[i].selected) {
                $scope.send_control_message(new messages.StateUnSelected($scope.client_id, states[i].id));
            }
            states[i].selected = false;
            states[i].remote_selected = false;
        }
        for (i = 0; i < transitions.length; i++) {
            transitions[i].remote_selected = false;
            transitions[i].selected = false;
            $scope.send_control_message(new messages.TransitionUnSelected($scope.client_id, transitions[i].id));
        }
    };

    $scope.clear_selections = function () {

        var i = 0;
        var states = $scope.states;
        var transitions = $scope.transitions;
        $scope.selected_items = [];
        $scope.selected_states = [];
        $scope.selected_transitions = [];
        for (i = 0; i < states.length; i++) {
            if (states[i].selected) {
                $scope.send_control_message(new messages.StateUnSelected($scope.client_id, states[i].id));
            }
            states[i].selected = false;
        }
        for (i = 0; i < transitions.length; i++) {
            transitions[i].selected = false;
            $scope.send_control_message(new messages.TransitionUnSelected($scope.client_id, transitions[i].id));
        }
    };

    $scope.select_items = function (multiple_selection) {

        var i = 0;
        var states = $scope.states;
        var last_selected_state = null;
        var last_selected_transition = null;

        $scope.pressedX = $scope.mouseX;
        $scope.pressedY = $scope.mouseY;
        $scope.pressedScaledX = $scope.scaledX;
        $scope.pressedScaledY = $scope.scaledY;

        if (!multiple_selection) {
            $scope.clear_selections();
        }

        for (i = states.length - 1; i >= 0; i--) {
            if (states[i].is_selected($scope.scaledX, $scope.scaledY)) {
                states[i].selected = true;
                $scope.send_control_message(new messages.StateSelected($scope.client_id, states[i].id));
                last_selected_state = states[i];
                if ($scope.selected_items.indexOf(states[i]) === -1) {
                    $scope.selected_items.push(states[i]);
                }
                if ($scope.selected_states.indexOf(states[i]) === -1) {
                    $scope.selected_states.push(states[i]);
                }
                if (!multiple_selection) {
                    break;
                }
            }
        }

        // Do not select links if a state was selected
        if (last_selected_state === null) {
            for (i = 0; i < $scope.transitions.length; i++) {
                if($scope.transitions[i].is_selected($scope.scaledX, $scope.scaledY)) {
                    $scope.transitions[i].selected = true;
                    $scope.send_control_message(new messages.TransitionSelected($scope.client_id, $scope.transitions[i].id));
                    last_selected_transition = $scope.transitions[i];
                    if ($scope.selected_items.indexOf($scope.transitions[i]) === -1) {
                        $scope.selected_items.push($scope.transitions[i]);
                    }
                    if ($scope.selected_transitions.indexOf($scope.transitions[i]) === -1) {
                        $scope.selected_transitions.push($scope.transitions[i]);
                        if (!multiple_selection) {
                            break;
                        }
                    }
                }
            }
        }
        return {last_selected_state: last_selected_state,
                last_selected_transition: last_selected_transition};
    };

    $scope.forget_time = function () {
        $scope.history.splice($scope.time_pointer);
    };


    // Event Handlers

    $scope.onMouseDown = function ($event) {
      $scope.last_event = $event;
      $scope.first_channel.send("MouseDown", $event);
      $scope.onMouseDownResult = getMouseEventResult($event);
	  $event.preventDefault();
    };

    $scope.onMouseUp = function ($event) {
      $scope.last_event = $event;
      $scope.first_channel.send("MouseUp", $event);
      $scope.onMouseUpResult = getMouseEventResult($event);
	  $event.preventDefault();
    };

    $scope.onMouseEnter = function ($event) {
      $scope.onMouseEnterResult = getMouseEventResult($event);
      $scope.cursor.hidden = false;
	  $event.preventDefault();
    };

    $scope.onMouseLeave = function ($event) {
      $scope.onMouseLeaveResult = getMouseEventResult($event);
      $scope.cursor.hidden = true;
	  $event.preventDefault();
    };

    $scope.onMouseMove = function ($event) {
      var coords = getCrossBrowserElementCoords($event);
      $scope.cursor.hidden = false;
      $scope.cursor.x = coords.x;
      $scope.cursor.y = coords.y;
      $scope.mouseX = coords.x;
      $scope.mouseY = coords.y;
      $scope.updateScaledXY();
      $scope.first_channel.send("MouseMove", $event);
      $scope.onMouseMoveResult = getMouseEventResult($event);
	  $event.preventDefault();
    };

    $scope.onMouseOver = function ($event) {
      $scope.onMouseOverResult = getMouseEventResult($event);
      $scope.cursor.hidden = false;
	  $event.preventDefault();
    };

    $scope.onMouseWheel = function ($event, delta, deltaX, deltaY) {
      $scope.last_event = $event;
      $scope.first_channel.send("MouseWheel", [$event, delta, deltaX, deltaY]);
      event.preventDefault();
    };

    $scope.onKeyDown = function ($event) {
        $scope.last_event = $event;
        $scope.last_key = $event.key;
        $scope.last_key_code = $event.keyCode;
        $scope.first_channel.send("KeyDown", $event);
        $scope.$apply();
        $event.preventDefault();
    };

    $document.bind("keydown", $scope.onKeyDown);

    // Button Event Handlers

    $scope.send_snapshot = function () {
        var data = JSON.stringify(['Snapshot', {"sender": $scope.client_id,
                                                "states": $scope.states,
                                                "transitions": $scope.transitions,
                                                "scale": $scope.scale,
                                                "panX": $scope.panX,
                                                "panY": $scope.panY,
                                                "message_id": $scope.message_id_seq()}]);
        $scope.control_socket.send(data);
    };

    $scope.onDownloadButton = function (button) {
        console.log(button.label);
        window.open("/prototype/download?finite_state_machine_id=" + $scope.finite_state_machine_id);
    };

    $scope.onUploadButton = function (button) {
        console.log(button.label);
        window.open("/prototype/upload", "_top");
    };

    $scope.onDownloadTraceButton = function (button) {
        console.log(button.label);
        window.open("/prototype/download_trace?finite_state_machine_id=" + $scope.finite_state_machine_id + "&trace_id=" + $scope.trace_id + "&client_id=" + $scope.client_id);
    };

    $scope.onUploadTraceButton = function (button) {
        console.log(button.label);
        window.open("/prototype/upload_trace?finite_state_machine_id=" + $scope.finite_state_machine_id, "_top");
    };

    // Buttons

    $scope.buttons = [
      new models.Button("Download", 10, 10, 60, 50, $scope.onDownloadButton, $scope),
      new models.Button("Upload", 70, 10, 60, 50, $scope.onUploadButton, $scope),
      new models.Button("DownloadTrace", 130, 10, 60, 50, $scope.onDownloadTraceButton, $scope),
      new models.Button("UploadTrace", 190, 10, 60, 50, $scope.onUploadTraceButton, $scope)
    ];


    $scope.onStateCreate = function(data) {
        $scope.create_state(data);
    };

    $scope.create_state = function(data) {
        var state = new models.State(data.id,
                                     data.label,
                                     data.x,
                                     data.y);
        $scope.state_id_seq = util.natural_numbers(data.id);
        $scope.states.push(state);
    };

    $scope.onStateLabelEdit = function(data) {
        $scope.edit_state_label(data);
    };

    $scope.edit_state_label = function(data) {
        var i = 0;
        for (i = 0; i < $scope.states.length; i++) {
            if ($scope.states[i].id === data.id) {
                $scope.states[i].label = data.label;
                break;
            }
        }
    };

    $scope.onTransitionCreate = function(data) {
        $scope.create_transition(data);
    };

    $scope.create_transition = function(data) {
        var i = 0;
        var new_transition = new models.Transition(null, null, null);
        new_transition.id = data.id;
        $scope.transition_id_seq = util.natural_numbers(data.id);
        for (i = 0; i < $scope.states.length; i++){
            if ($scope.states[i].id === data.from_id) {
                new_transition.from_state = $scope.states[i];
            }
        }
        for (i = 0; i < $scope.states.length; i++){
            if ($scope.states[i].id === data.to_id) {
                new_transition.to_state = $scope.states[i];
            }
        }
        if (new_transition.from_state !== null && new_transition.to_state !== null) {
            $scope.transitions.push(new_transition);
        }

        $scope.update_offsets();
    };

    $scope.onTransitionDestroy = function(data) {
        $scope.destroy_transition(data);
    };

    $scope.destroy_transition = function(data) {
        var i = 0;
        var transition = null;
        var index = -1;
        for (i = 0; i < $scope.transitions.length; i++) {
            transition = $scope.transitions[i];
            if (transition.from_state.id === data.from_id && transition.to_state.id === data.to_id) {
                index = $scope.transitions.indexOf(transition);
                $scope.transitions.splice(index, 1);
            }
        }

        $scope.update_offsets();
    };

    $scope.onTransitionLabelEdit = function(data) {
        var i = 0;
        for (i = 0; i < $scope.transitions.length; i++) {
            if ($scope.transitions[i].id === data.id) {
                $scope.transitions[i].label = data.label;
                break;
            }
        }
    };

    $scope.onStateMove = function(data) {
        $scope.move_states(data);
    };

    $scope.move_states = function(data) {
        var i = 0;
        for (i = 0; i < $scope.states.length; i++) {
            if ($scope.states[i].id === data.id) {
                $scope.states[i].x = data.x;
                $scope.states[i].y = data.y;
                break;
            }
        }
    };

    $scope.onStateDestroy = function(data) {
        $scope.destroy_state(data);
    };

    $scope.destroy_state = function(data) {

        // Delete the state and any transitions connecting to the state.
        var i = 0;
        var j = 0;
        var dindex = -1;
        var lindex = -1;
        var states = $scope.states.slice();
        var all_transitions = $scope.transitions.slice();
        for (i = 0; i < states.length; i++) {
            if (states[i].id === data.id) {
                dindex = $scope.states.indexOf(states[i]);
                if (dindex !== -1) {
                    $scope.states.splice(dindex, 1);
                }
                lindex = -1;
                for (j = 0; j < all_transitions.length; j++) {
                    if (all_transitions[j].to_state === states[i] ||
                        all_transitions[j].from_state === states[i]) {
                        lindex = $scope.transitions.indexOf(all_transitions[j]);
                        if (lindex !== -1) {
                            $scope.transitions.splice(lindex, 1);
                        }
                    }
                }
            }
        }
    };

    $scope.redo = function(type_data) {
        var type = type_data[0];
        var data = type_data[1];

        if (type === "StateMove") {
            $scope.move_states(data);
        }

        if (type === "StateCreate") {
            $scope.create_state(data);
        }

        if (type === "StateDestroy") {
            $scope.destroy_state(data);
        }

        if (type === "StateLabelEdit") {
            $scope.edit_state_label(data);
        }

        if (type === "TransitionCreate") {
            $scope.create_transition(data);
        }

        if (type === "TransitionDestroy") {
            $scope.destroy_transition(data);
        }
    };


    $scope.undo = function(type_data) {
        var type = type_data[0];
        var data = type_data[1];
        var inverted_data;

        if (type === "StateMove") {
            inverted_data = angular.copy(data);
            inverted_data.x = data.previous_x;
            inverted_data.y = data.previous_y;
            $scope.move_states(inverted_data);
        }

        if (type === "StateCreate") {
            $scope.destroy_state(data);
        }

        if (type === "StateDestroy") {
            inverted_data = new messages.StateCreate(data.sender,
                                                      data.id,
                                                      data.previous_x,
                                                      data.previous_y,
                                                      data.previous_label,
                                                      data.previous_type);
            $scope.create_state(inverted_data);
        }

        if (type === "StateLabelEdit") {
            inverted_data = angular.copy(data);
            inverted_data.label = data.previous_label;
            $scope.edit_state_label(inverted_data);
        }

        if (type === "TransitionCreate") {
            $scope.destroy_transition(data);
        }

        if (type === "TransitionDestroy") {
            $scope.create_transition(data);
        }
    };

    $scope.onClientId = function(data) {
        $scope.client_id = data;
    };

    $scope.onFiniteStateMachine = function(data) {
        $scope.finite_state_machine_id = data.finite_state_machine_id;
        $scope.finite_state_machine_name = data.name;
        $scope.state_id_seq = util.natural_numbers(data.state_id_seq);
        $scope.transition_id_seq = util.natural_numbers(data.transition_id_seq);
        var search_data = {finite_state_machine_id: data.finite_state_machine_id};
        if ($scope.replay_id !== 0) {
            search_data.replay_id = $scope.replay_id;
            $http.get('/prototype/download_replay?replay_id=' + $scope.replay_id)
                .then(function (response) {
                    $scope.replay_data = response.data;
                    console.log(response);
                })
                .catch(function (response) {
                    console.log(response);
                });
        }
        $location.search(search_data);
    };

    $scope.onTransitionSelected = function(data) {
        console.log('onTransitionSelected');
        var i = 0;
        for (i = 0; i < $scope.transitions.length; i++) {
            if ($scope.transitions[i].id === data.id) {
                $scope.transitions[i].remote_selected = true;
                console.log($scope.transitions[i].remote_selected);
            }
        }
    };

    $scope.onTransitionUnSelected = function(data) {
        console.log('onTransitionSelected');
        var i = 0;
        for (i = 0; i < $scope.transitions.length; i++) {
            if ($scope.transitions[i].id === data.id) {
                $scope.transitions[i].remote_selected = false;
                console.log($scope.transitions[i].remote_selected);
            }
        }
    };

    $scope.onStateSelected = function(data) {
        var i = 0;
        for (i = 0; i < $scope.states.length; i++) {
            if ($scope.states[i].id === data.id) {
                $scope.states[i].remote_selected = true;
                console.log($scope.states[i].remote_selected);
            }
        }
    };

    $scope.onStateUnSelected = function(data) {
        var i = 0;
        for (i = 0; i < $scope.states.length; i++) {
            if ($scope.states[i].id === data.id) {
                $scope.states[i].remote_selected = false;
                console.log($scope.states[i].remote_selected);
            }
        }
    };

    $scope.onHistory = function (data) {

        $scope.history = [];
        var i = 0;
        for (i = 0; i < data.length; i++) {
            //console.log(data[i]);
            $scope.history.push(data[i]);
        }
    };

    $scope.onSnapshot = function (data) {

        //Erase the existing state
        $scope.states = [];
        $scope.transitions = [];

        var state_map = {};
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
                new_state = new models.State(state.id,
                                               state.label,
                                               state.x,
                                               state.y);
                $scope.states.push(new_state);
                state_map[state.id] = new_state;
            }
        }
        window.state_map = state_map;

        //Build the transitions
        var transition = null;
        for (i = 0; i < data.transitions.length; i++) {
            transition = data.transitions[i];
            if (max_transition_id === null || transition.id > max_transition_id) {
                max_transition_id = transition.id;
            }
            console.log(transition);
            $scope.transitions.push(new models.Transition(transition.id,
                                                          state_map[transition.from_state],
                                                          state_map[transition.to_state],
                                                          transition.label));
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

            $scope.current_scale = Math.min(2, Math.max(0.10, Math.min((window.innerWidth-200)/diff_x, (window.innerHeight-300)/diff_y)));
            $scope.updateScaledXY();
            $scope.updatePanAndScale();
        }
        // Calculate the new panX and panY to show the entire diagram
        if (min_x !== null && min_y !== null) {
            console.log(['min_x', min_x]);
            console.log(['min_y', min_y]);
            diff_x = max_x - min_x;
            diff_y = max_y - min_y;
            $scope.panX = $scope.current_scale * (-min_x - diff_x/2) + window.innerWidth/2;
            $scope.panY = $scope.current_scale * (-min_y - diff_y/2) + window.innerHeight/2;
            $scope.updateScaledXY();
            $scope.updatePanAndScale();
        }

        //Update the state_id_seq to be greater than all state ids to prevent duplicate ids.
        if (max_state_id !== null) {
            console.log(['max_state_id', max_state_id]);
            $scope.state_id_seq = util.natural_numbers(max_state_id);
        }

        if (max_transition_id !== null) {
            console.log(['max_transition_id', max_transition_id]);
            $scope.transition_id_seq = util.natural_numbers(max_transition_id);
        }

        $scope.update_offsets();
    };


    $scope.control_socket.onmessage = function(message) {
        $scope.first_channel.send("Message", message);
        $scope.$apply();
    };

	$scope.control_socket.onopen = function() {
        //Ignore
	};

	// Call onopen directly if $scope.control_socket is already open
	if ($scope.control_socket.readyState === WebSocket.OPEN) {
		$scope.control_socket.onopen();
	}

    $scope.send_trace_message = function (message) {
        console.log(message);
        if ($scope.history.length === 0) {
            $scope.send_snapshot();
        }
        message.sender = $scope.client_id;
        message.trace_id = $scope.trace_id;
        message.message_id = $scope.message_id_seq();
        var data = messages.serialize(message);
        //console.log(["Sending", message.constructor.name, message.sender, message.message_id]);
        $scope.control_socket.send(data);
    };

    $scope.send_control_message = function (message) {
        //console.log(message);
        if ($scope.history.length === 0) {
            $scope.send_snapshot();
        }
        message.sender = $scope.client_id;
        message.message_id = $scope.message_id_seq();
        var data = messages.serialize(message);
        //console.log(["Sending", message.constructor.name, message.sender, message.message_id]);
        $scope.control_socket.send(data);
    };


    // End web socket
    //

	angular.element($window).bind('resize', function(){

		$scope.graph.width = $window.innerWidth;
	  	$scope.graph.right_column = $window.innerWidth - 300;
	  	$scope.graph.height = $window.innerHeight;

		// manuall $digest required as resize event
		// is outside of angular
	 	$scope.$digest();
    });

    //60fps ~ 17ms delay
    setInterval( function () {
        $scope.frame = Math.floor(window.performance.now());
        $scope.$apply();
    }, 17);

    setInterval( function () {
        if ($scope.replay_data.length > 0) {
            $scope.clear_all_selections();
            var replay = $scope.replay_data.pop(0);
            while(replay.fsm_name !== $scope.finite_state_machine_name && $scope.replay_data.length > 0) {
                replay = $scope.replay_data.pop(0);
            }
            console.log(replay);
            if (replay.fsm_name === $scope.finite_state_machine_name) {
                var from_state = null;
                var to_state = null;
                var transition = null;
                var i = 0;
                for (i = 0; i < $scope.states.length; i++) {
                    if ($scope.states[i].label === replay.from_state) {
                        from_state = $scope.states[i];
                        from_state.remote_selected = true;
                    }
                    if ($scope.states[i].label === replay.to_state) {
                        to_state = $scope.states[i];
                        to_state.selected = true;
                    }
                }
                if (from_state !== null && to_state !== null) {
                    for (i = 0; i < $scope.transitions.length; i++) {
                        transition = $scope.transitions[i];
                        //Match the message handlers with an "on" prefix
                        if (from_state.id === transition.from_state.id &&
                            to_state.id === transition.to_state.id &&
                            transition.label === "on" + replay.message_type) {
                            transition.selected = true;
                        }
                        //Match the start and end special cases
                        if (from_state.id === transition.from_state.id &&
                            to_state.id === transition.to_state.id &&
                            transition.label === replay.message_type) {
                            transition.selected = true;
                        }
                    }
                }
            }
        }
    }, 1000);

    window.scope = $scope;
});

app.directive('cursor', function() {
  return { restrict: 'A', templateUrl: 'widgets/cursor.html' };
});

app.directive('debug', function() {
  return { restrict: 'A', templateUrl: 'widgets/debug.html' };
});

app.directive('state', function() {
  return { restrict: 'A', templateUrl: 'widgets/state.html' };
});

app.directive('fsmTransition', function() {
  return { restrict: 'A', templateUrl: 'widgets/transition.html' };
});

app.directive('quadrants', function() {
  return { restrict: 'A', templateUrl: 'widgets/quadrants.html' };
});

app.directive('download', function() {
  return { restrict: 'A', templateUrl: 'widgets/download.svg' };
});

app.directive('upload', function() {
  return { restrict: 'A', templateUrl: 'widgets/upload.svg' };
});


exports.app = app;
