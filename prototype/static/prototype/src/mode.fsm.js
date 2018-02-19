var inherits = require('inherits');
var fsm = require('./fsm.js');
var move_fsm = require('./move.js');
var group_fsm = require('./group.fsm.js');

function _State () {
}
inherits(_State, fsm._State);


function _Start () {
    this.name = 'Start';
}
inherits(_Start, _State);
var Start = new _Start();
exports.Start = Start;

function _MultiFSM () {
    this.name = 'MultiFSM';
}
inherits(_MultiFSM, _State);
var MultiFSM = new _MultiFSM();
exports.MultiFSM = MultiFSM;

function _FSM () {
    this.name = 'FSM';
}
inherits(_FSM, _State);
var FSM = new _FSM();
exports.FSM = FSM;




_Start.prototype.start = function (controller) {

    controller.changeState(MultiFSM);

};
_Start.prototype.start.transitions = ['MultiFSM'];



_MultiFSM.prototype.onMouseWheel = function (controller, msg_type, $event) {

    if (controller.scope.current_scale >= 0.5) {
        controller.changeState(FSM);
    }

    controller.delegate_channel.send(msg_type, $event);

};
_MultiFSM.prototype.onMouseWheel.transitions = ['FSM'];



_FSM.prototype.onMouseWheel = function (controller, msg_type, $event) {

    if (controller.scope.current_scale < 0.5) {
        controller.changeState(MultiFSM);
    }

    controller.delegate_channel.send(msg_type, $event);
};
_FSM.prototype.onMouseWheel.transitions = ['MultiFSM'];

_FSM.prototype.end = function(controller) {
    controller.scope.group_controller.changeState(group_fsm.Disabled);
    controller.scope.move_controller.changeState(move_fsm.Disabled);
};

_FSM.prototype.start = function(controller) {
    controller.scope.group_controller.changeState(group_fsm.Ready);
    controller.scope.move_controller.changeState(move_fsm.Ready);
};
