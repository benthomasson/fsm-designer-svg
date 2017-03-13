function FSMController () {
    this.state = null;
}
exports.FSMController = FSMController;

FSMController.prototoype.changeState = function (state) {
    if(this.state !== null) {
        this.state.end(this);
    }
    this.state = state;
    if(state !== null) {
        state.start(this);
    }
};

function _State () {
};

_State.prototoype.start = function (controller) {
};

_State.prototoype.end = function (controller) {
};

var State = new _State();
exports.State = State;
exports._State = _State;
