var inherits = require('inherits');
var fsm = require('./fsm.js');
var models = require('./models.js');
var messages = require('./messages.js');

function _State () {
}
inherits(_State, fsm._State);

_State.prototype.onMouseMove = function (controller, $event) {
    controller.next_controller.state.onMouseMove(controller.next_controller, $event);
};
_State.prototype.onMouseUp = function (controller, $event) {
    controller.next_controller.state.onMouseUp(controller.next_controller, $event);
};
_State.prototype.onMouseDown = function (controller, $event) {
    controller.next_controller.state.onMouseDown(controller.next_controller, $event);
};
_State.prototype.onMouseWheel = function (controller, $event, delta, deltaX, deltaY) {
    controller.next_controller.state.onMouseWheel(controller.next_controller, $event, delta, deltaX, deltaY);
};
_State.prototype.onKeyDown = function (controller, $event) {
    controller.next_controller.state.onKeyDown(controller.next_controller, $event);
};


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

_Ready.prototype.onMouseDown = function (controller, $event) {

    var last_selected_state = controller.scope.select_states($event.shiftKey);

    if (last_selected_state !== null) {
        controller.changeState(Selected1);
    } else {
        controller.next_controller.state.onMouseDown(controller.next_controller, $event);
    }
};
_Ready.prototype.onMouseDown.transitions = ['Selected1'];


_Ready.prototype.onKeyDown = function(controller, $event) {

	var scope = controller.scope;
    var state = null;

	if ($event.key === 'r') {
		state = new models.State(controller.scope.state_id_seq(),
                                   "Router",
                                   scope.scaledX,
                                   scope.scaledY,
                                   "router");
	}
    else if ($event.key === 's') {
		state = new models.State(controller.scope.state_id_seq(),
                                   "Switch",
                                   scope.scaledX,
                                   scope.scaledY,
                                   "switch");
	}
    else if ($event.key === 'a') {
		state = new models.State(controller.scope.state_id_seq(),
                                   "Rack",
                                   scope.scaledX,
                                   scope.scaledY,
                                   "rack");
	}
    else if ($event.key === 'h') {
		state = new models.State(controller.scope.state_id_seq(),
                                   "Host",
                                   scope.scaledX,
                                   scope.scaledY,
                                   "host");
	}

    if (state !== null) {
        scope.states.push(state);
        scope.send_control_message(new messages.StateCreate(scope.client_id,
                                                             state.id,
                                                             state.x,
                                                             state.y,
                                                             state.name,
                                                             state.type));
    }

	controller.next_controller.state.onKeyDown(controller.next_controller, $event);
};

_Start.prototype.start = function (controller) {

    controller.changeState(Ready);

};
_Start.prototype.start.transitions = ['Ready'];



_Selected2.prototype.onMouseDown = function (controller, $event) {

    if (controller.scope.selected_states.length === 1) {
        var current_selected_state = controller.scope.selected_states[0];
        var last_selected_state = controller.scope.select_states($event.shiftKey);
        if (current_selected_state === last_selected_state) {
            controller.changeState(Selected3);
            return;
        }
    }

    controller.changeState(Ready);
    controller.state.onMouseDown(controller, $event);
};
_Selected2.prototype.onMouseDown.transitions = ['Ready', 'Selected3'];

_Selected2.prototype.onKeyDown = function (controller, $event) {

    if ($event.keyCode === 8) {
        //Delete
        controller.changeState(Ready);

        var i = 0;
        var j = 0;
        var index = -1;
        var states = controller.scope.selected_states;
        var all_transitions = controller.scope.transitions.slice();
        controller.scope.selected_states = [];
        controller.scope.selected_transitions = [];
        for (i = 0; i < states.length; i++) {
            index = controller.scope.states.indexOf(states[i]);
            if (index !== -1) {
                controller.scope.states.splice(index, 1);
                controller.scope.send_control_message(new messages.StateDestroy(controller.scope.client_id,
                                                                                 states[i].id,
                                                                                 states[i].x,
                                                                                 states[i].y,
                                                                                 states[i].name,
                                                                                 states[i].type));
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
    }
};
_Selected2.prototype.onMouseUp.transitions = ['Ready'];


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

    var states = controller.scope.selected_states;

    var diffX = controller.scope.scaledX - controller.scope.pressedScaledX;
    var diffY = controller.scope.scaledY - controller.scope.pressedScaledY;
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
    controller.scope.pressedScaledX = controller.scope.scaledX;
    controller.scope.pressedScaledY = controller.scope.scaledY;
};


_Move.prototype.onMouseUp = function (controller, $event) {

    controller.changeState(Selected2);
    controller.state.onMouseUp(controller, $event);
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
    controller.scope.selected_states[0].edit_label = true;
};

_EditLabel.prototype.end = function (controller) {
    controller.scope.selected_states[0].edit_label = false;
};

_EditLabel.prototype.onMouseDown = function (controller, $event) {

    controller.changeState(Ready);
    controller.state.onMouseDown(controller, $event);

};
_EditLabel.prototype.onMouseDown.transitions = ['Ready'];


_EditLabel.prototype.onKeyDown = function (controller, $event) {
    //Key codes found here:
    //https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
	var state = controller.scope.selected_states[0];
    var previous_name = state.name;
	if ($event.keyCode === 8 || $event.keyCode === 46) { //Delete
		state.name = state.name.slice(0, -1);
	} else if ($event.keyCode >= 48 && $event.keyCode <=90) { //Alphanumeric
        state.name += $event.key;
	} else if ($event.keyCode >= 186 && $event.keyCode <=222) { //Punctuation
        state.name += $event.key;
	} else if ($event.keyCode === 13) { //Enter
        controller.changeState(Selected2);
    }
    controller.scope.send_control_message(new messages.StateLabelEdit(controller.scope.client_id,
                                                                       state.id,
                                                                       state.name,
                                                                       previous_name));
};
_EditLabel.prototype.onKeyDown.transitions = ['Selected2'];
