var inherits = require('inherits');
var fsm = require('../fsm.js');
var models = require('./models.js');
var messages = require('./messages.js');

function _State () {
}
inherits(_State, fsm._State);


function _Ready () {
    this.name = 'Ready';
}
inherits(_Ready, _State);
var Ready = new _Ready();
exports.Ready = Ready;

function _Start () {
    this.name = 'Start';
}
inherits(_Start, _State);
var Start = new _Start();
exports.Start = Start;

function _Selected2 () {
    this.name = 'Selected2';
}
inherits(_Selected2, _State);
var Selected2 = new _Selected2();
exports.Selected2 = Selected2;

function _Selected3 () {
    this.name = 'Selected3';
}
inherits(_Selected3, _State);
var Selected3 = new _Selected3();
exports.Selected3 = Selected3;

function _Move () {
    this.name = 'Move';
}
inherits(_Move, _State);
var Move = new _Move();
exports.Move = Move;

function _Selected1 () {
    this.name = 'Selected1';
}
inherits(_Selected1, _State);
var Selected1 = new _Selected1();
exports.Selected1 = Selected1;



function _EditLabel () {
    this.name = 'EditLabel';
}
inherits(_EditLabel, _State);
var EditLabel = new _EditLabel();
exports.EditLabel = EditLabel;


function _Disabled () {
        this.name = 'Disabled';
}
inherits(_Disabled, _State);
var Disabled = new _Disabled();
exports.Disabled = Disabled;


_Ready.prototype.onMouseDown = function (controller, msg_type, $event) {

    var last_selected = controller.scope.select_items($event.shiftKey);

    if (last_selected.last_selected_state !== null) {
        controller.changeState(Selected1);
    } else if (last_selected.last_selected_transition !== null) {
        controller.changeState(Selected1);
    } else {
        controller.delegate_channel.send(msg_type, $event);
    }
};
_Ready.prototype.onMouseDown.transitions = ['Selected1'];


_Ready.prototype.onNewState = function(controller) {

  var scope = controller.scope;
    var state = null;

    state = new models.State(controller.scope.state_id_seq(),
                               "State",
                               scope.state.scaledX,
                               scope.state.scaledY,
                               "state");

    scope.state.states.push(state);
    console.log(scope.state.states);
    scope.send_control_message(new messages.StateCreate(scope.client_id,
                                                         state.id,
                                                         state.x,
                                                         state.y,
                                                             state.label));
};

_Start.prototype.start = function (controller) {

    controller.changeState(Ready);

};
_Start.prototype.start.transitions = ['Ready'];



_Selected2.prototype.onMouseDown = function (controller, msg_type, $event) {

    var last_selected = null;

    if (controller.scope.state.selected_states.length === 1) {
        var current_selected_state = controller.scope.state.selected_states[0];
        last_selected = controller.scope.select_items($event.shiftKey);
        if (current_selected_state === last_selected.last_selected_state) {
            controller.changeState(Selected3);
            return;
        }
    }

    if (controller.scope.state.selected_transitions.length === 1) {
        var current_selected_transition = controller.scope.state.selected_transitions[0];
        last_selected = controller.scope.select_items($event.shiftKey);
        if (current_selected_transition === last_selected.last_selected_transition) {
            controller.changeState(Selected3);
            return;
        }
    }

    controller.changeState(Ready);
    controller.handle_message(msg_type, $event);
};
_Selected2.prototype.onMouseDown.transitions = ['Ready', 'Selected3'];

_Selected2.prototype.onKeyDown = function (controller, msg_type, $event) {

    if ($event.keyCode === 8) {
        //Delete
        controller.changeState(Ready);

        var i = 0;
        var j = 0;
        var index = -1;
        var states = controller.scope.state.selected_states;
        var transitions = controller.scope.state.selected_transitions.slice();
        var all_transitions = controller.scope.transitions.slice();
        controller.scope.state.selected_states = [];
        controller.scope.state.selected_transitions = [];
        for (i = 0; i < states.length; i++) {
            index = controller.scope.states.indexOf(states[i]);
            if (index !== -1) {
                controller.scope.states.splice(index, 1);
                controller.scope.send_control_message(new messages.StateDestroy(controller.scope.client_id,
                                                                                 states[i].id,
                                                                                 states[i].x,
                                                                                 states[i].y,
                                                                                 states[i].label));
            }
            for (j = 0; j < all_transitions.length; j++) {
                if (all_transitions[j].to_state === states[i] ||
                    all_transitions[j].from_state === states[i]) {
                    index = controller.scope.transitions.indexOf(all_transitions[j]);
                    if (index !== -1) {
                        controller.scope.transitions.splice(index, 1);
                    }
                }
            }
        }
        for (i = 0; i < transitions.length; i++) {
            index = controller.scope.transitions.indexOf(transitions[i]);
            if (index !== -1) {
                controller.scope.transitions.splice(index, 1);
                controller.scope.send_control_message(new messages.TransitionDestroy(controller.scope.client_id,
                                                                                     transitions[i].id,
                                                                                     transitions[i].from_state.id,
                                                                                     transitions[i].to_state.id,
                                                                                     transitions[i].label));
                }
        }
    } else {
        controller.delegate_channel.send(msg_type, $event);
    }
};
_Selected2.prototype.onKeyDown.transitions = ['Ready'];


_Selected1.prototype.onMouseMove = function (controller) {

    controller.changeState(Move);

};
_Selected1.prototype.onMouseMove.transitions = ['Move'];

_Selected1.prototype.onMouseUp = function (controller) {

    controller.changeState(Selected2);

};
_Selected1.prototype.onMouseUp.transitions = ['Selected2'];

_Selected1.prototype.onMouseDown = function () {

};

_Move.prototype.onMouseMove = function (controller) {

    var states = controller.scope.state.selected_states;

    var diffX = controller.scope.state.scaledX - controller.scope.state.pressedScaledX;
    var diffY = controller.scope.state.scaledY - controller.scope.state.pressedScaledY;
    var i = 0;
    var previous_x, previous_y;
    for (i = 0; i < states.length; i++) {
        previous_x = states[i].x;
        previous_y = states[i].y;
        states[i].x = states[i].x + diffX;
        states[i].y = states[i].y + diffY;
        controller.scope.send_control_message(new messages.StateMove(controller.scope.client_id,
                                                                      states[i].id,
                                                                      states[i].x,
                                                                      states[i].y,
                                                                      previous_x,
                                                                      previous_y));
    }
    controller.scope.setState({
      pressedScaledX: controller.scope.state.scaledX,
      pressedScaledY: controller.scope.state.scaledY
    });
};


_Move.prototype.onMouseUp = function (controller, msg_type, $event) {

    controller.changeState(Selected2);
    controller.handle_message(msg_type, $event);
};
_Move.prototype.onMouseUp.transitions = ['Selected2'];

_Selected3.prototype.onMouseUp = function (controller) {
    controller.changeState(EditLabel);
};
_Selected3.prototype.onMouseUp.transitions = ['EditLabel'];


_Selected3.prototype.onMouseMove = function (controller) {
    controller.changeState(Move);
};
_Selected3.prototype.onMouseMove.transitions = ['Move'];


_EditLabel.prototype.start = function (controller) {
    controller.scope.state.selected_items[0].edit_label = true;
};

_EditLabel.prototype.end = function (controller) {
    controller.scope.state.selected_items[0].edit_label = false;
};

_EditLabel.prototype.onMouseDown = function (controller, msg_type, $event) {

    controller.changeState(Ready);
    controller.handle_message(msg_type, $event);
};
_EditLabel.prototype.onMouseDown.transitions = ['Ready'];


_EditLabel.prototype.onKeyDown = function (controller, msg_type, $event) {
    //Key codes found here:
    //https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
  var item = controller.scope.state.selected_items[0];
    var previous_label = item.label;
  if ($event.keyCode === 8 || $event.keyCode === 46) { //Delete
    item.label = item.label.slice(0, -1);
  } else if ($event.keyCode >= 48 && $event.keyCode <=90) { //Alphanumeric
        item.label += $event.key;
  } else if ($event.keyCode >= 186 && $event.keyCode <=222) { //Punctuation
        item.label += $event.key;
  } else if ($event.keyCode === 13) { //Enter
        controller.changeState(Selected2);
    }
    if (item.constructor.name === "State") {
        controller.scope.send_control_message(new messages.StateLabelEdit(controller.scope.client_id,
                                                                           item.id,
                                                                           item.label,
                                                                           previous_label));
    }
    if (item.constructor.name === "Transition") {
        controller.scope.send_control_message(new messages.TransitionLabelEdit(controller.scope.client_id,
                                                                           item.id,
                                                                           item.label,
                                                                           previous_label));
    }
};
_EditLabel.prototype.onKeyDown.transitions = ['Selected2'];

