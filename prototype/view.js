var inherits = require('inherits');
var fsm = require('./fsm.js');

function _State () {
}
inherits(_State, fsm._State);

_State.prototype.mouseMove = function () {
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

function _Scale () {
    this.name = 'Scale';
}
inherits(_Scale, _State);
var Scale = new _Scale();
exports.Scale = Scale;

function _Pressed () {
    this.name = 'Pressed';
}
inherits(_Pressed, _State);
var Pressed = new _Pressed();
exports.Pressed = Pressed;

function _Pan () {
    this.name = 'Pan';
}
inherits(_Pan, _State);
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


_Pan.prototype.mouseMove = function (controller) {

    controller.changeState(Pan);
};


_Pan.prototype.mouseUp = function (controller) {

    controller.changeState(Ready);

};

