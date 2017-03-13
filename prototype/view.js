var inherits = require('inherits');
var fsm = require('./fsm.js');

function _State () {
}
inherits(_State, fsm._State);

_State.prototype.onMouseMove = function () {
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




_Ready.prototype.onMouseDown = function (controller) {

    controller.changeState(Pressed);

};

_Ready.prototype.onMouseWheel = function (controller, event, delta, deltaX, deltaY) {

    controller.changeState(Scale);
    controller.state.onMouseWheel(controller, event, delta, deltaX, deltaY);
};



_Start.prototype.start = function (controller) {

    controller.changeState(Ready);

};



_Scale.prototype.timeout = function (controller) {

    controller.changeState(Ready);

};


_Scale.prototype.onMouseWheel = function (controller, event, delta, deltaX, deltaY) {
      var g = document.getElementById('frame_g');
      var new_scale = Math.max(0.1, Math.min(10, (controller.scope.current_scale + delta / 100)));
      var new_panX = controller.scope.mouseX - new_scale * ((controller.scope.mouseX - controller.scope.panX) / controller.scope.current_scale);
      var new_panY = controller.scope.mouseY - new_scale * ((controller.scope.mouseY - controller.scope.panY) / controller.scope.current_scale);
      controller.scope.current_scale = new_scale;
      controller.scope.panX = new_panX;
      controller.scope.panY = new_panY;
      g.setAttribute('transform','translate(' + controller.scope.panX + ',' + controller.scope.panY + ') scale(' + controller.scope.current_scale + ')');
      controller.changeState(Ready);
};


_Pressed.prototype.onMouseUp = function (controller) {

    controller.changeState(Ready);

};

_Pressed.prototype.onMouseMove = function (controller) {

    controller.changeState(Pan);
    controller.state.onMouseMove
};


_Pan.prototype.onMouseMove = function (controller) {

    controller.changeState(Pan);
};


_Pan.prototype.onMouseUp = function (controller) {

    controller.changeState(Ready);

};

