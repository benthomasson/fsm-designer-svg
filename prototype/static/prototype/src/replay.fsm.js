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


function _Disabled () {
        this.name = 'Disabled';
}
inherits(_Disabled, _State);
var Disabled = new _Disabled();
exports.Disabled = Disabled;


function show_replay($scope, replay) {

    if (replay.fsm_name === $scope.diagram_name) {
        var from_state = null;
        var to_state = null;
        var transition = null;
        var i = 0;
        for (i = 0; i < $scope.states.length; i++) {
            if ($scope.states[i].label === replay.from_state) {
                from_state = $scope.states[i];
                from_state.remote_selected = true;
            }
            if ($scope.states[i].label === replay.to_state) {
                to_state = $scope.states[i];
                to_state.selected = true;
            }
        }
        if (from_state !== null && to_state !== null) {
            for (i = 0; i < $scope.transitions.length; i++) {
                transition = $scope.transitions[i];
                //Match the message handlers with an "on" prefix
                if (from_state.id === transition.from_state.id &&
                    to_state.id === transition.to_state.id &&
                    transition.label === "on" + replay.message_type) {
                    transition.selected = true;
                }
                //Match the start and end special cases
                if (from_state.id === transition.from_state.id &&
                    to_state.id === transition.to_state.id &&
                    transition.label === replay.message_type) {
                    transition.selected = true;
                }
            }
        }
    }
}
exports.show_replay = show_replay;


_Start.prototype.start = function (controller) {

    controller.changeState(Disabled);
};
_Start.prototype.start.transitions = ['Disabled'];


_Play.prototype.start = function (controller) {
    var $scope = controller.scope;
    controller.scope.replay_play = true;
    if ($scope.replay_index >= ($scope.replay_data.length - 1)) {
        $scope.replay_index = -1;
    }
};

_Play.prototype.onTogglePause = function (controller) {

    controller.changeState(Pause);
};
_Play.prototype.onTogglePause.transitions = ['Pause'];

_Play.prototype.onRestart = function (controller) {
    controller.scope.replay_index = -1;
};

_Play.prototype.onReplayTick = function (controller) {

    var $scope = controller.scope;

    if ($scope.replay_index < ($scope.replay_data.length - 1)) {
        $scope.clear_all_selections();
        $scope.replay_index += 1;
        var replay = $scope.replay_data[$scope.replay_index];
        while(replay.fsm_name !== $scope.diagram_name && $scope.replay_index < ($scope.replay_data.length - 1)) {
            $scope.replay_index += 1;
            replay = $scope.replay_data[$scope.replay_index];
        }
        show_replay($scope, replay);
    }
    if ($scope.replay_index >= ($scope.replay_data.length - 1)) {
        controller.changeState(Pause);
    }
};
_Play.prototype.onReplayTick.transitions = ['Pause'];

_Play.prototype.onStepBack = function (controller, msg_type, message) {
    controller.changeState(Pause);
    controller.handle_message(msg_type, message);
};
_Play.prototype.onStepBack.transtions = ['_Pause'];

_Play.prototype.onStepForward = function (controller, msg_type, message) {
    controller.changeState(Pause);
    controller.handle_message(msg_type, message);
};
_Play.prototype.onStepForward.transtions = ['_Pause'];

_Pause.prototype.start = function (controller) {
    controller.scope.replay_play = false;
};

_Pause.prototype.onRestart = function (controller) {

    controller.scope.replay_index = -1;
    controller.changeState(Play);
};
_Pause.prototype.onRestart.transitions = ['Play'];

_Pause.prototype.onTogglePause = function (controller) {

    controller.changeState(Play);

};
_Pause.prototype.onTogglePause.transitions = ['Play'];


_Pause.prototype.onStepForward = function (controller) {

    var $scope = controller.scope;

    if ($scope.replay_index < ($scope.replay_data.length - 1)) {
        $scope.clear_all_selections();
        $scope.replay_index += 1;
        var replay = $scope.replay_data[$scope.replay_index];
        while(replay.fsm_name !== $scope.diagram_name && $scope.replay_index < ($scope.replay_data.length - 1)) {
            $scope.replay_index += 1;
            replay = $scope.replay_data[$scope.replay_index];
        }
        show_replay($scope, replay);
    }
};

_Pause.prototype.onStepBack = function (controller) {

    var $scope = controller.scope;

    if ($scope.replay_index > 0) {
        $scope.clear_all_selections();
        $scope.replay_index -= 1;
        var replay = $scope.replay_data[$scope.replay_index];
        while(replay.fsm_name !== $scope.diagram_name && $scope.replay_index > 0) {
            $scope.replay_index -= 1;
            replay = $scope.replay_data[$scope.replay_index];
        }
        show_replay($scope, replay);
    } else {
        $scope.replay_index = -1;
    }
};
