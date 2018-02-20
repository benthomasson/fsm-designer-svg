var inherits = require('inherits');
var fsm = require('./fsm.js');
var models = require('./models.js');
var messages = require('./messages.js');

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

function _Connected () {
    this.name = 'Connected';
}
inherits(_Connected, _State);
var Connected = new _Connected();
exports.Connected = Connected;

function _Connecting () {
    this.name = 'Connecting';
}
inherits(_Connecting, _State);
var Connecting = new _Connecting();
exports.Connecting = Connecting;

function _Selecting () {
    this.name = 'Selecting';
}
inherits(_Selecting, _State);
var Selecting = new _Selecting();
exports.Selecting = Selecting;

function _Disabled () {
        this.name = 'Disabled';
}
inherits(_Disabled, _State);
var Disabled = new _Disabled();
exports.Disabled = Disabled;

_Ready.prototype.onNewChannel = function (controller) {

    controller.scope.clear_selections();
    controller.changeState(Selecting);
};
_Ready.prototype.onNewChannel.transitions = ['Selecting'];



_Start.prototype.start = function (controller) {

    controller.changeState(Ready);

};
_Start.prototype.start.transitions = ['Ready'];



_Connected.prototype.start = function (controller) {

    controller.scope.clear_selections();
    controller.changeState(Ready);
};
_Connected.prototype.start.transitions = ['Ready'];


_Connecting.prototype.onMouseDown = function () {
};

_Connecting.prototype.onMouseUp = function (controller) {

    var selected = controller.scope.select_fsms(false);
    if (selected.last_selected_fsm !== null) {
        controller.scope.new_channel.to_fsm = selected.last_selected_fsm;
        controller.scope.send_control_message(new messages.ChannelCreate(controller.scope.client_id,
                                              controller.scope.new_channel.id,
                                              controller.scope.new_channel.from_fsm.id,
                                              controller.scope.new_channel.to_fsm.id),
                                              '');
        controller.scope.new_channel = null;
        controller.scope.update_offsets();
        controller.changeState(Connected);
    } else {
        var index = controller.scope.channels.indexOf(controller.scope.new_channel);
        if (index !== -1) {
            controller.scope.channels.splice(index, 1);
        }
        controller.scope.new_channel = null;
        controller.changeState(Ready);
    }
};
_Connecting.prototype.onMouseUp.transitions = ['Ready', 'Connected'];


_Selecting.prototype.onMouseDown = function () {
};

_Selecting.prototype.onMouseUp = function (controller) {

    var selected = controller.scope.select_fsms(false);
    if (selected.last_selected_fsm !== null) {
        controller.scope.new_channel = new models.Channel(controller.scope.channel_id_seq(), selected.last_selected_fsm, null, '');
        controller.scope.channels.push(controller.scope.new_channel);
        controller.changeState(Connecting);
    }
};
_Selecting.prototype.onMouseUp.transitions = ['Connecting'];

