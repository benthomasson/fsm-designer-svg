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

function _Connected () {
    this.name = 'Connected';
}
inherits(_Connected, _State);
var Connected = new _Connected();
exports.Connected = Connected;

function _Connecting () {
    this.name = 'Connecting';
}
inherits(_Connecting, _State);
var Connecting = new _Connecting();
exports.Connecting = Connecting;

function _Selecting () {
    this.name = 'Selecting';
}
inherits(_Selecting, _State);
var Selecting = new _Selecting();
exports.Selecting = Selecting;




_Ready.prototype.onKeyDown = function(controller, $event) {

    if ($event.key === 'l') {
        controller.state.onNewTransition(controller, $event);
    }

	controller.next_controller.state.onKeyDown(controller.next_controller, $event);
};

_Ready.prototype.onNewTransition = function (controller) {

    controller.scope.clear_selections();
    controller.changeState(Selecting);
};



_Start.prototype.start = function (controller) {

    controller.changeState(Ready);

};



_Connected.prototype.start = function (controller) {

    controller.scope.clear_selections();
    controller.changeState(Ready);
};


_Connecting.prototype.onMouseDown = function () {
};

_Connecting.prototype.onMouseUp = function (controller) {

    var selected = controller.scope.select_items(false);
    if (selected.last_selected_state !== null) {
        controller.scope.new_transition.to_state = selected.last_selected_state;
        controller.scope.send_control_message(new messages.TransitionCreate(controller.scope.client_id,
            controller.scope.new_transition.id,
                                                                            controller.scope.new_transition.from_state.id,
                                                                            controller.scope.new_transition.to_state.id),
                '');
        controller.scope.new_transition = null;
        controller.scope.update_offsets();
        controller.changeState(Connected);
    } else {
        var index = controller.scope.transitions.indexOf(controller.scope.new_transition);
        if (index !== -1) {
            controller.scope.transitions.splice(index, 1);
        }
        controller.scope.new_transition = null;
        controller.changeState(Ready);
    }
};


_Selecting.prototype.onMouseDown = function () {
};

_Selecting.prototype.onMouseUp = function (controller) {

    var selected = controller.scope.select_items(false);
    if (selected.last_selected_state !== null) {
        controller.scope.new_transition = new models.Transition(controller.scope.transition_id_seq(), selected.last_selected_state, null, '');
        controller.scope.transitions.push(controller.scope.new_transition);
        controller.changeState(Connecting);
    }
};

