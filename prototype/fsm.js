function FSMController () {
    this.state = null;
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
