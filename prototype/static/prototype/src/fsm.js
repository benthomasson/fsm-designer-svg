function Channel(from_controller, to_controller) {
    this.from_controller = from_controller;
    this.to_controller = to_controller;
}
exports.Channel = Channel;

Channel.prototype.send = function(msg_type, message) {
    this.to_controller.handle_message(msg_type, message);
};

function NullChannel(from_controller) {
    this.from_controller = from_controller;
}

NullChannel.prototype.send = function() {
};

function FSMController (scope, initial_state) {
    this.scope = scope;
    this.state = initial_state;
    this.state.start(this);
    this.delegate_channel = new NullChannel(this);
}
exports.FSMController = FSMController;

FSMController.prototype.changeState = function (state) {
    console.log(state);
    if(this.state !== null) {
        this.state.end(this);
    }
    this.state = state;
    if(state !== null) {
        state.start(this);
    }
};

FSMController.prototype.handle_message = function(msg_type, message) {

    var handler_name = 'on' + msg_type;
    if (typeof(this.state[handler_name]) !== "undefined") {
        this.state[handler_name](this, msg_type, message);
    } else {
        this.default_handler(msg_type, message);
    }
};

FSMController.prototype.default_handler = function(msg_type, message) {
    this.delegate_channel.send(msg_type, message);
};


function _State () {
}

_State.prototype.start = function () {
};

_State.prototype.end = function () {
};

var State = new _State();
exports.State = State;
exports._State = _State;
