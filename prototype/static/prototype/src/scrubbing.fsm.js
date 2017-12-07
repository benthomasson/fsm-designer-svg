var inherits = require('inherits');
var fsm = require('./fsm.js');
var replay = require('./replay.fsm.js');

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

function _Clicked () {
    this.name = 'Clicked';
}
inherits(_Clicked, _State);
var Clicked = new _Clicked();
exports.Clicked = Clicked;

function _Pressed () {
    this.name = 'Pressed';
}
inherits(_Pressed, _State);
var Pressed = new _Pressed();
exports.Pressed = Pressed;

function _Scrubbing () {
    this.name = 'Scrubbing';
}
inherits(_Scrubbing, _State);
var Scrubbing = new _Scrubbing();
exports.Scrubbing = Scrubbing;


_Start.prototype.start = function (controller) {

    controller.changeState(Ready);
};
_Start.prototype.start.transitions = ['Ready'];


_Ready.prototype.onMouseDown = function (controller, msg_type, message) {

    if (controller.scope.replay_slider.is_selected(controller.scope.mouseX, controller.scope.mouseY)) {
        controller.changeState(Pressed);
    } else {
        controller.delegate_channel.send(msg_type, message);
    }

};
_Ready.prototype.onMouseDown.transitions = ['Pressed'];



_Clicked.prototype.start = function (controller) {

    controller.scope.replay_index = Math.min(Math.max(0,
                                                      Math.floor((controller.scope.pressedX - controller.scope.replay_slider.x) /
                                                                 (controller.scope.replay_slider.width / controller.scope.replay_data.length))),
                                              controller.scope.replay_data.length - 1);
    controller.scope.clear_all_selections();
    replay.show_replay(controller.scope, controller.scope.replay_data[controller.scope.replay_index]);
    controller.changeState(Ready);
};
_Clicked.prototype.start.transitions = ['Ready'];


_Pressed.prototype.start = function (controller) {

    controller.scope.pressedX = controller.scope.mouseX;
};

_Pressed.prototype.onMouseMove = function (controller) {

    controller.changeState(Scrubbing);
};
_Pressed.prototype.onMouseMove.transitions = ['Scrubbing'];

_Pressed.prototype.onMouseUp = function (controller) {

    controller.changeState(Clicked);
};
_Pressed.prototype.onMouseUp.transitions = ['Clicked'];


_Scrubbing.prototype.onMouseMove = function (controller) {
    controller.scope.last_replay_index = controller.scope.replay_index;

    controller.scope.replay_index = Math.min(Math.max(0,
                                                      Math.floor((controller.scope.mouseX - controller.scope.replay_slider.x) /
                                                                 (controller.scope.replay_slider.width / controller.scope.replay_data.length))),
                                              controller.scope.replay_data.length - 1);
    if (controller.scope.last_replay_index !== controller.scope.replay_index) {
        controller.scope.clear_all_selections();
        replay.show_replay(controller.scope, controller.scope.replay_data[controller.scope.replay_index]);
    }
};

_Scrubbing.prototype.onMouseUp = function (controller) {

    controller.changeState(Ready);
};
_Scrubbing.prototype.onMouseUp.transitions = ['Ready'];

