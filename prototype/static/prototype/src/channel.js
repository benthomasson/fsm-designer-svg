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

function _Selected2 () {
    this.name = 'Selected2';
}
inherits(_Selected2, _State);
var Selected2 = new _Selected2();
exports.Selected2 = Selected2;

function _Selected3 () {
    this.name = 'Selected3';
}
inherits(_Selected3, _State);
var Selected3 = new _Selected3();
exports.Selected3 = Selected3;

function _Selected1 () {
    this.name = 'Selected1';
}
inherits(_Selected1, _State);
var Selected1 = new _Selected1();
exports.Selected1 = Selected1;

function _EditLabel () {
    this.name = 'EditLabel';
}
inherits(_EditLabel, _State);
var EditLabel = new _EditLabel();
exports.EditLabel = EditLabel;


_Ready.prototype.onNewChannel = function (controller) {

    controller.scope.clear_selections();
    controller.changeState(Selecting);
};
_Ready.prototype.onNewChannel.transitions = ['Selecting'];


_Ready.prototype.onMouseDown = function (controller, msg_type, $event) {

    var last_selected = controller.scope.select_channels($event.shiftKey);

    if (last_selected.last_selected_channel !== null) {
        controller.changeState(Selected1);
    } else {
        controller.delegate_channel.send(msg_type, $event);
    }
};
_Ready.prototype.onMouseDown.transitions = ['Selected1'];


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
        controller.scope.update_channel_offsets();
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


_Selected2.prototype.onMouseDown = function (controller, msg_type, $event) {

    var last_selected = null;

    if (controller.scope.selected_channels.length === 1) {
        var current_selected_channel = controller.scope.selected_channels[0];
        last_selected = controller.scope.select_channels($event.shiftKey);
        if (current_selected_channel === last_selected.last_selected_channel) {
            controller.changeState(Selected3);
            return;
        }
    }

    controller.changeState(Ready);
    controller.handle_message(msg_type, $event);
};
_Selected2.prototype.onMouseDown.transitions = ['Ready', 'Selected3'];

_Selected2.prototype.onKeyDown = function (controller, msg_type, $event) {

    if ($event.keyCode === 8) {
        //Delete
        controller.changeState(Ready);

        var i = 0;
        var index = -1;
        var channels = controller.scope.selected_channels.slice();
        controller.scope.selected_channels = [];
        for (i = 0; i < channels.length; i++) {
            index = controller.scope.channels.indexOf(channels[i]);
            if (index !== -1) {
                controller.scope.channels.splice(index, 1);
                controller.scope.send_control_message(new messages.ChannelDestroy(controller.scope.client_id,
                                                                                  channels[i].id,
                                                                                  channels[i].from_fsm.id,
                                                                                  channels[i].to_fsm.id,
                                                                                  channels[i].label));
                }
        }
        controller.scope.update_channel_offsets();
    } else {
        controller.delegate_channel.send(msg_type, $event);
    }
};
_Selected2.prototype.onKeyDown.transitions = ['Ready'];


_Selected1.prototype.onMouseUp = function (controller) {

    controller.changeState(Selected2);

};
_Selected1.prototype.onMouseUp.transitions = ['Selected2'];

_Selected1.prototype.onMouseDown = function () {

};

_Selected3.prototype.onMouseUp = function (controller) {
    controller.changeState(EditLabel);
};
_Selected3.prototype.onMouseUp.transitions = ['EditLabel'];


_EditLabel.prototype.start = function (controller) {
    controller.scope.selected_channels[0].edit_label = true;
};

_EditLabel.prototype.end = function (controller) {
    controller.scope.selected_channels[0].edit_label = false;
};

_EditLabel.prototype.onMouseDown = function (controller, msg_type, $event) {

    controller.changeState(Ready);
    controller.handle_message(msg_type, $event);
};
_EditLabel.prototype.onMouseDown.transitions = ['Ready'];


_EditLabel.prototype.onKeyDown = function (controller, msg_type, $event) {
    //Key codes found here:
    //https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
	var item = controller.scope.selected_channels[0];
    var previous_label = item.label;
	if ($event.keyCode === 8 || $event.keyCode === 46) { //Delete
		item.label = item.label.slice(0, -1);
	} else if ($event.keyCode >= 48 && $event.keyCode <=90) { //Alphanumeric
        item.label += $event.key;
	} else if ($event.keyCode >= 186 && $event.keyCode <=222) { //Punctuation
        item.label += $event.key;
	} else if ($event.keyCode === 13) { //Enter
        controller.changeState(Selected2);
    }
    controller.scope.send_control_message(new messages.ChannelLabelEdit(controller.scope.client_id,
                                                                        item.id,
                                                                        item.label,
                                                                        previous_label));
};
_EditLabel.prototype.onKeyDown.transitions = ['Selected2'];
