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
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onDeviceCreate(data);
        }
    }
    if (type === 'LinkCreate') {
        controller.scope.history.push(message.data);
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onLinkCreate(data);
        }
    }
    if (type === 'DeviceMove') {
        controller.scope.history.push(message.data);
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onDeviceMove(data);
        }
    }
    if (type === 'DeviceDestroy') {
        controller.scope.history.push(message.data);
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onDeviceDestroy(data);
        }
    }
    if (type === 'DeviceLabelEdit') {
        controller.scope.history.push(message.data);
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onDeviceLabelEdit(data);
        }
    }
    if (type === 'DeviceSelected') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onDeviceSelected(data);
        }
    }
    if (type === 'DeviceUnSelected') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onDeviceUnSelected(data);
        }
    }
    if (type === 'Snapshot') {
        controller.scope.history.push(message.data);
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onSnapshot(data);
        }
    }
    if (type === 'id') {
        controller.scope.onClientId(data);
    }
    if (type === 'Topology') {
        controller.scope.onTopology(data);
    }
    if (type === 'History') {
        controller.scope.onHistory(data);
    }
};

_Present.prototype.onMouseWheel = function (controller, $event, delta, deltaX, deltaY) {

    if ($event.originalEvent.metaKey) {
        console.log(delta);
        if (delta < 0) {
            //controller.changeState(Past);
            controller.scope.time_pointer = controller.scope.history.length - 1;
            if (controller.scope.time_pointer >= 0) {
                var change = controller.scope.history[controller.scope.time_pointer];
                var type_data = JSON.parse(change);
                var type = type_data[0];
                var data = type_data[1];
                var inverted_data = angular.copy(data);

                console.log(type);

                if (type === "DeviceMove") {
                    inverted_data.x = data.previous_x;
                    inverted_data.y = data.previous_y;
                    controller.scope.move_devices(inverted_data);
                }

                controller.scope.history.splice(-1);
            }
        }
    } else {
        controller.next_controller.state.onMouseWheel(controller.next_controller, $event, delta, deltaX, deltaY);
    }

};
_Present.prototype.onMouseWheel.transitions = ['Past'];

