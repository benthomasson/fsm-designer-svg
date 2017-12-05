var inherits = require('inherits');
var fsm = require('./fsm.js');

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



_MultiFSM.prototype.onMouseWheel = function (controller) {

    controller.changeState(FSM);

};
_MultiFSM.prototype.onMouseWheel.transitions = ['FSM'];



_FSM.prototype.onMouseWheel = function (controller) {

    controller.changeState(MultiFSM);

};
_FSM.prototype.onMouseWheel.transitions = ['MultiFSM'];

