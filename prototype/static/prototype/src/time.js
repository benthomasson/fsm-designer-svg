var inherits = require('inherits');
var fsm = require('./fsm.js');
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

    //console.log(message.data);
    var type_data = JSON.parse(message.data);
    var type = type_data[0];
    var data = type_data[1];

    if (['StateCreate',
         'StateDestroy',
         'StateMove',
         'StateLabelEdit',
         'TransitionLabelEdit',
         'TransitionCreate',
         'TransitionDestroy'].indexOf(type) !== -1) {
        controller.changeState(Present);
        controller.scope.history.splice(controller.scope.time_pointer);
        if (data.sender !== controller.scope.client_id) {
            controller.state.onMessage(controller, message);
        } else {
            controller.scope.history.push(message.data);
        }
    }

    if (type === 'TransitionSelected') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onTransitionSelected(data);
        }
    }
    if (type === 'TransitionUnSelected') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onTransitionUnSelected(data);
        }
    }

    if (type === 'StateSelected') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onStateSelected(data);
        }
    }
    if (type === 'StateUnSelected') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onStateUnSelected(data);
        }
    }

    if (type === 'Undo') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.time_pointer = Math.max(0, controller.scope.time_pointer - 1);
            controller.scope.undo(data.original_message);
        }
    }
    if (type === 'Redo') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.time_pointer = Math.min(controller.scope.history.length, controller.scope.time_pointer + 1);
            controller.scope.redo(data.original_message);
            if (controller.scope.time_pointer === controller.scope.history.length) {
                controller.changeState(Present);
            }
        }
    }
};

_Past.prototype.onMouseWheel = function (controller, $event, delta, deltaX, deltaY) {

    if ($event.originalEvent.metaKey) {
        //console.log(delta);
        if (delta < 0) {
            this.undo(controller);
        } else if (delta > 0) {
            this.redo(controller);
        }
    } else {
        controller.next_controller.state.onMouseWheel(controller.next_controller, $event, delta, deltaX, deltaY);
    }

};
_Past.prototype.onMouseWheel.transitions = ['Past'];

_Past.prototype.onKeyDown = function(controller, $event) {

    //console.log($event);

    if ($event.key === 'z' && $event.metaKey && ! $event.shiftKey) {
        this.undo(controller);
        return;
    } else if ($event.key === 'z' && $event.ctrlKey && ! $event.shiftKey) {
        this.undo(controller);
        return;
    } else if ($event.key === 'Z' && $event.metaKey && $event.shiftKey) {
        this.redo(controller);
        return;
    } else if ($event.key === 'Z' && $event.ctrlKey && $event.shiftKey) {
        this.redo(controller);
        return;
    } else {
        controller.next_controller.state.onKeyDown(controller.next_controller, $event);
    }
};
_Past.prototype.onKeyDown.transitions = ['Past'];


_Past.prototype.undo = function(controller) {
    //controller.changeState(Past);
    controller.scope.time_pointer = Math.max(0, controller.scope.time_pointer - 1);
    if (controller.scope.time_pointer >= 0) {
        var change = controller.scope.history[controller.scope.time_pointer];
        var type_data = JSON.parse(change);
        controller.scope.send_control_message(new messages.Undo(controller.scope.client_id,
                                                                type_data));


        controller.scope.undo(type_data);
    }
};

_Past.prototype.redo = function(controller) {


    if (controller.scope.time_pointer < controller.scope.history.length) {
        var change = controller.scope.history[controller.scope.time_pointer];
        var type_data = JSON.parse(change);
        controller.scope.send_control_message(new messages.Redo(controller.scope.client_id,
                                                                type_data));
        controller.scope.redo(type_data);
        controller.scope.time_pointer = Math.min(controller.scope.history.length, controller.scope.time_pointer + 1);
        if (controller.scope.time_pointer === controller.scope.history.length) {
            controller.changeState(Present);
        }
    } else {
        controller.changeState(Present);
    }
};

_Start.prototype.start = function (controller) {

    controller.changeState(Present);

};
_Start.prototype.start.transitions = ['Present'];

_Present.prototype.handle_oom = function(controller, data) {

    var oom = null;
    var i = null;
    var oom_type_data = null;

    if (typeof(controller.scope.client_messages[data.sender]) === "undefined") {
        controller.scope.client_messages[data.sender] = data.message_id;
    }

    if (typeof(controller.scope.out_of_order_messages[data.sender]) === "undefined") {
        controller.scope.out_of_order_messages[data.sender] = [];
    }

    if (controller.scope.out_of_order_messages[data.sender].length > 0) {
        console.log(["Handling oom", data.sender, controller.scope.out_of_order_messages[data.sender].length]);

        oom = controller.scope.out_of_order_messages[data.sender].slice();
        controller.scope.out_of_order_messages[data.sender] = [];

        for (i = 0; i < oom.length; i++) {
            if (controller.scope.client_messages[data.sender] + 1 === oom[i][0]) {
                console.log(["Resend", oom[i][0], oom[i][1]]);
                oom_type_data = JSON.parse(oom[i][1].data);
                controller.scope.client_messages[data.sender] = oom_type_data[1].message_id;
                this.processMessage(controller, oom[i][1], oom_type_data[0], oom_type_data[1]);
            } else {
                controller.scope.out_of_order_messages[data.sender].push(oom[i]);
            }
        }
    }
};

_Present.prototype.onMessage = function(controller, message) {

    //console.log(message.data);
    var type_data = JSON.parse(message.data);
    var type = type_data[0];
    var data = type_data[1];


    //Fix out of order messages
    console.log(["RECV", data.sender, data.message_id]);

    this.handle_oom(controller, data);

    if (controller.scope.client_messages[data.sender] < data.message_id &&
        controller.scope.client_messages[data.sender] + 1 !== data.message_id) {
        console.log(["Missing message", controller.scope.client_messages[data.sender] + 1]);
        controller.scope.out_of_order_messages[data.sender].push([data.message_id, message]);
        return;
    } else if (controller.scope.client_messages[data.sender] > data.message_id) {
        console.log(["Out of order message", controller.scope.client_messages[data.sender], data.message_id]);
    }
    controller.scope.client_messages[data.sender] = data.message_id;
    //End fix out of order messages
    this.processMessage(controller, message, type, data);

    this.handle_oom(controller, data);

};

_Present.prototype.processMessage = function(controller, message, type, data) {

    console.log(["PROCESS", data.sender, data.message_id]);

    if (type === 'StateCreate') {
        controller.scope.history.push(message.data);
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onStateCreate(data);
        }
    }
    if (type === 'TransitionCreate') {
        controller.scope.history.push(message.data);
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onTransitionCreate(data);
        }
    }
    if (type === 'StateMove') {
        controller.scope.history.push(message.data);
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onStateMove(data);
        }
    }
    if (type === 'StateDestroy') {
        controller.scope.history.push(message.data);
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onStateDestroy(data);
        }
    }
    if (type === 'StateLabelEdit') {
        controller.scope.history.push(message.data);
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onStateLabelEdit(data);
        }
    }
    if (type === 'TransitionLabelEdit') {
        controller.scope.history.push(message.data);
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onTransitionLabelEdit(data);
        }
    }
    if (type === 'TransitionSelected') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onTransitionSelected(data);
        }
    }
    if (type === 'TransitionUnSelected') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onTransitionUnSelected(data);
        }
    }
    if (type === 'StateSelected') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onStateSelected(data);
        }
    }
    if (type === 'StateUnSelected') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.onStateUnSelected(data);
        }
    }
    if (type === 'Undo') {
        if (data.sender !== controller.scope.client_id) {
            controller.scope.time_pointer = Math.max(0, controller.scope.time_pointer - 1);
            controller.scope.undo(data.original_message);
            controller.changeState(Past);
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
    if (type === 'FiniteStateMachine') {
        controller.scope.onFiniteStateMachine(data);
    }
    if (type === 'History') {
        controller.scope.onHistory(data);
    }
};
_Present.prototype.onMessage.transitions = ['Past'];

_Present.prototype.onMouseWheel = function (controller, $event, delta, deltaX, deltaY) {

    if ($event.originalEvent.metaKey) {
        //console.log(delta);
        if (delta < 0) {
            this.undo(controller);
        }
    } else {
        controller.next_controller.state.onMouseWheel(controller.next_controller, $event, delta, deltaX, deltaY);
    }

};
_Present.prototype.onMouseWheel.transitions = ['Past'];

_Present.prototype.onKeyDown = function(controller, $event) {

    //console.log($event);

    if ($event.key === 'z' && $event.metaKey && ! $event.shiftKey) {
        this.undo(controller);
        return;
    } else if ($event.key === 'z' && $event.ctrlKey && ! $event.shiftKey) {
        this.undo(controller);
        return;
    } else {
        controller.next_controller.state.onKeyDown(controller.next_controller, $event);
    }
};
_Present.prototype.onKeyDown.transitions = ['Past'];


_Present.prototype.undo = function(controller) {
    //controller.changeState(Past);
    controller.scope.time_pointer = controller.scope.history.length - 1;
    if (controller.scope.time_pointer >= 0) {
        var change = controller.scope.history[controller.scope.time_pointer];
        var type_data = JSON.parse(change);
        controller.scope.send_control_message(new messages.Undo(controller.scope.client_id,
                                                                type_data));

        controller.scope.undo(type_data);
        controller.changeState(Past);
    }
};
