var inhertits = require('inherits');
var fsm = require('./fsm.js');


function _Ready () {
}
inhertits('_Ready', fsm._State);
var Ready = new _Ready();
exports.Ready = Ready;

function _Start () {
}
inhertits('_Start', fsm._State);
var Start = new _Start();
exports.Start = Start;

function _Scale () {
}
inhertits('_Scale', fsm._State);
var Scale = new _Scale();
exports.Scale = Scale;

function _Pressed () {
}
inhertits('_Pressed', fsm._State);
var Pressed = new _Pressed();
exports.Pressed = Pressed;

function _Pan () {
}
inhertits('_Pan', fsm._State);
var Pan = new _Pan();
exports.Pan = Pan;




_Ready.prototype.mouseDown = function (controller) {

    controller.changeState(Pressed);

};

_Ready.prototype.mouseWheel = function (controller) {

    controller.changeState(Scale);

};



_Start.prototype.start = function (controller) {

    controller.changeState(Ready);

};



_Scale.prototype.timeout = function (controller) {

    controller.changeState(Ready);

};



_Pressed.prototype.mouseUp = function (controller) {

    controller.changeState(Ready);

};

_Pressed.prototype.mouseMove = function (controller) {

    controller.changeState(Pan);

};



_Pan.prototype.mouseUp = function (controller) {

    controller.changeState(Ready);

};

