var inherits = require('inherits');
var fsm = require('./fsm.js');

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


function _Past () {
    this.name = 'Past';
}
inherits(_Past, _State);
var Past = new _Past();
exports.Past = Past;

function _Start () {
    this.name = 'Start';
}
inherits(_Start, _State);
var Start = new _Start();
exports.Start = Start;

function _Present () {
    this.name = 'Present';
}
inherits(_Present, _State);
var Present = new _Present();
exports.Present = Present;

_Past.prototype.start = function (controller) {

    controller.scope.time_pointer = controller.scope.history.length - 1;
};

_Past.prototype.onMouseWheel = function (controller, $event, delta, deltaX, deltaY) {

    controller.next_controller.state.onMouseWheel(controller.next_controller, $event, delta, deltaX, deltaY);
    //controller.changeState(Present);

};
_Past.prototype.onMouseWheel.transitions = ['Present'];


_Past.prototype.onMessage = function(controller, message) {

    console.log(message.data);
    var type_data = JSON.parse(message.data);
    var type = type_data[0];
    var data = type_data[1];

    if (type === 'DeviceSelected') {
        controller.scope.onDeviceSelected(data);
    }
    if (type === 'DeviceUnSelected') {
        controller.scope.onDeviceUnSelected(data);
    }
};

_Start.prototype.start = function (controller) {

    controller.changeState(Present);

};
_Start.prototype.start.transitions = ['Present'];

_Present.prototype.onMessage = function(controller, message) {

    console.log(message.data);
    var type_data = JSON.parse(message.data);
    var type = type_data[0];
    var data = type_data[1];

    if (type === 'DeviceCreate') {
        controller.scope.history.push(message.data);
        controller.scope.onDeviceCreate(data);
    }
    if (type === 'LinkCreate') {
        controller.scope.history.push(message.data);
        controller.scope.onLinkCreate(data);
    }
    if (type === 'DeviceMove') {
        controller.scope.history.push(message.data);
        controller.scope.onDeviceMove(data);
    }
    if (type === 'DeviceDestroy') {
        controller.scope.history.push(message.data);
        controller.scope.onDeviceDestroy(data);
    }
    if (type === 'DeviceLabelEdit') {
        controller.scope.history.push(message.data);
        controller.scope.onDeviceLabelEdit(data);
    }
    if (type === 'DeviceSelected') {
        controller.scope.onDeviceSelected(data);
    }
    if (type === 'DeviceUnSelected') {
        controller.scope.onDeviceUnSelected(data);
    }
    if (type === 'Snapshot') {
        controller.scope.history.push(message.data);
        controller.scope.onSnapshot(data);
    }
    if (type === 'id') {
        controller.scope.onClientId(data);
    }
    if (type === 'topology') {
        controller.scope.onTopology(data);
    }
};

_Present.prototype.onMouseWheel = function (controller, $event, delta, deltaX, deltaY) {

    if ($event.originalEvent.metaKey) {
        if (delta < 0) {
            controller.changeState(Past);
        }
        console.log(delta);
    } else {
        controller.next_controller.state.onMouseWheel(controller.next_controller, $event, delta, deltaX, deltaY);
    }

};
_Present.prototype.onMouseWheel.transitions = ['Past'];

