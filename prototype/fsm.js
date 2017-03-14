function FSMController (scope, initial_state, next_controller) {
    this.scope = scope;
    this.state = initial_state;
    this.state.start(this);
    this.next_controller = next_controller;
}
exports.FSMController = FSMController;

FSMController.prototype.changeState = function (state) {
    if(this.state !== null) {
        this.state.end(this);
    }
    this.state = state;
    if(state !== null) {
        state.start(this);
    }
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
