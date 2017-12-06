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

function _Play () {
    this.name = 'Play';
}
inherits(_Play, _State);
var Play = new _Play();
exports.Play = Play;

function _Pause () {
    this.name = 'Pause';
}
inherits(_Pause, _State);
var Pause = new _Pause();
exports.Pause = Pause;




_Start.prototype.start = function (controller) {

    controller.changeState(Play);

};
_Start.prototype.start.transitions = ['Play'];



_Play.prototype.onPause = function (controller) {

    controller.changeState(Pause);

};
_Play.prototype.onPause.transitions = ['Pause'];



_Pause.prototype.onPlay = function (controller) {

    controller.changeState(Play);

};
_Pause.prototype.onPlay.transitions = ['Play'];

