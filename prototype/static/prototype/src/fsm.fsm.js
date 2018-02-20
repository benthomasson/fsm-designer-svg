/* Copyright (c) 2017 Red Hat, Inc. */
var inherits = require('inherits');
var fsm = require('./fsm.js');
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

function _Disabled () {
    this.name = 'Disabled';
}
inherits(_Disabled, _State);
var Disabled = new _Disabled();
exports.Disabled = Disabled;

function _Start () {
    this.name = 'Start';
}
inherits(_Start, _State);
var Start = new _Start();
exports.Start = Start;


function _Selected1 () {
    this.name = 'Selected1';
}
inherits(_Selected1, _State);
var Selected1 = new _Selected1();
exports.Selected1 = Selected1;

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

function _EditLabel () {
    this.name = 'EditLabel';
}
inherits(_EditLabel, _State);
var EditLabel = new _EditLabel();
exports.EditLabel = EditLabel;


function _Move () {
    this.name = 'Move';
}
inherits(_Move, _State);
var Move = new _Move();
exports.Move = Move;

_Start.prototype.start = function (controller) {

    controller.changeState(Ready);

};
_Start.prototype.start.transitions = ['Ready'];

_Selected1.prototype.onMouseUp = function (controller) {

    controller.changeState(Selected2);

};
_Selected1.prototype.onMouseUp.transitions = ['Selected2'];

_Selected1.prototype.onMouseMove = function (controller) {

    controller.changeState(Move);

};
_Selected1.prototype.onMouseMove.transitions = ['Move'];

_Selected2.prototype.onKeyDown = function (controller, msg_type, $event) {

    //controller.changeState(Ready);
    controller.delegate_channel.send(msg_type, $event);

};
_Selected2.prototype.onKeyDown.transitions = ['Ready'];

_Selected2.prototype.onMouseDown = function (controller, msg_type, $event) {

    controller.scope.pressedScaledX = controller.scope.scaledX;
    controller.scope.pressedScaledY = controller.scope.scaledY;

    var groups = controller.scope.selected_groups;
    var i = 0;
    var selected = false;
    controller.scope.selected_groups = [];

    for (i = 0; i < groups.length; i++) {
        if (groups[i].type !== "fsm") {
            continue;
        }
        if (groups[i].is_icon_selected(controller.scope.scaledX, controller.scope.scaledY)) {
            groups[i].selected = true;
            selected = true;
            controller.scope.selected_groups.push(groups[i]);
        }
    }

    if (selected) {
        controller.changeState(Selected3);
    } else {
        for (i = 0; i < groups.length; i++) {
            groups[i].selected = false;
        }
        controller.changeState(Ready);
        controller.handle_message(msg_type, $event);
    }
};
_Selected2.prototype.onMouseDown.transitions = ['Selected3', 'Ready'];

_Selected3.prototype.onMouseUp = function (controller) {

    controller.changeState(EditLabel);

};
_Selected3.prototype.onMouseUp.transitions = ['EditLabel'];


_Selected3.prototype.onMouseMove = function (controller) {

    controller.changeState(Move);

};
_Selected3.prototype.onMouseMove.transitions = ['Move'];


_EditLabel.prototype.start = function (controller) {
    controller.scope.selected_groups[0].edit_label = true;
};

_EditLabel.prototype.end = function (controller) {
    controller.scope.selected_groups[0].edit_label = false;
};


_EditLabel.prototype.onMouseDown = function (controller, msg_type, $event) {

    controller.changeState(Ready);
    controller.handle_message(msg_type, $event);
};
_EditLabel.prototype.onMouseDown.transitions = ['Ready'];


_EditLabel.prototype.onKeyDown = function (controller, msg_type, $event) {
    //Key codes found here:
    //https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
	var item = controller.scope.selected_groups[0];
    var previous_name = item.name;
	if ($event.keyCode === 8 || $event.keyCode === 46) { //Delete
		item.name = item.name.slice(0, -1);
	} else if ($event.keyCode >= 48 && $event.keyCode <=90) { //Alphanumeric
        item.name += $event.key;
	} else if ($event.keyCode >= 186 && $event.keyCode <=222) { //Punctuation
        item.name += $event.key;
	} else if ($event.keyCode === 13) { //Enter
        controller.changeState(Selected2);
	} else if ($event.keyCode === 32) { //Space
        item.name += " ";
    } else {
        console.log($event.keyCode);
    }
    controller.scope.send_control_message(new messages.GroupLabelEdit(controller.scope.client_id,
                                                                      item.id,
                                                                      item.name,
                                                                      previous_name));
};
_EditLabel.prototype.onKeyDown.transitions = ['Selected2'];


_Ready.prototype.onMouseDown = function (controller, msg_type, $event) {

    controller.scope.pressedScaledX = controller.scope.scaledX;
    controller.scope.pressedScaledY = controller.scope.scaledY;

    var groups = controller.scope.groups;
    var i = 0;
    var selected = false;
    controller.scope.clear_selections();

    for (i = 0; i < groups.length; i++) {
        if (groups[i].type !== "fsm") {
            continue;
        }
        if (groups[i].is_icon_selected(controller.scope.scaledX, controller.scope.scaledY)) {
            groups[i].selected = true;
            selected = true;
            controller.scope.selected_groups.push(groups[i]);
        }
    }

    if (selected) {
        controller.changeState(Selected1);
    } else {
        controller.delegate_channel.send(msg_type, $event);
    }
};
_Ready.prototype.onMouseDown.transitions = ['Selected1'];

_Move.prototype.start = function (controller) {

    var groups = controller.scope.selected_groups;

    var i = 0;
    for (i = 0; i < groups.length; i++) {
        groups[i].moving = true;
    }
};

_Move.prototype.end = function (controller) {

    var groups = controller.scope.selected_groups;

    var i = 0;
    var j = 0;
    for (i = 0; i < groups.length; i++) {
        for(j = 0; j < groups[i].states.length; j++) {
            groups[i].states[j].selected = false;
        }
    }

    for (i = 0; i < groups.length; i++) {
        groups[i].moving = false;
    }
};

_Move.prototype.onMouseUp = function (controller) {

    controller.changeState(Selected2);

};
_Move.prototype.onMouseUp.transitions = ['Selected2'];


_Move.prototype.onMouseMove = function (controller) {

    var groups = controller.scope.selected_groups;
    var states = null;

    console.log(groups);

    var diffX = controller.scope.scaledX - controller.scope.pressedScaledX;
    var diffY = controller.scope.scaledY - controller.scope.pressedScaledY;
    var i = 0;
    var j = 0;
    var previous_x1, previous_y1, previous_x2, previous_y2, previous_x, previous_y;
    var c_messages = [];
    for (i = 0; i < groups.length; i++) {
        c_messages = [];
        previous_x1 = groups[i].x1;
        previous_y1 = groups[i].y1;
        previous_x2 = groups[i].x2;
        previous_y2 = groups[i].y2;
        groups[i].x1 = groups[i].x1 + diffX;
        groups[i].y1 = groups[i].y1 + diffY;
        groups[i].x2 = groups[i].x2 + diffX;
        groups[i].y2 = groups[i].y2 + diffY;

        groups[i].update_xy();

        c_messages.push(new messages.GroupMove(controller.scope.client_id,
                                               groups[i].id,
                                               groups[i].x1,
                                               groups[i].y1,
                                               groups[i].x2,
                                               groups[i].y2,
                                               previous_x1,
                                               previous_y1,
                                               previous_x2,
                                               previous_y2));


        states = groups[i].states;
        for (j = 0; j < states.length; j++) {
            previous_x = states[j].x;
            previous_y = states[j].y;
            states[j].x = states[j].x + diffX;
            states[j].y = states[j].y + diffY;
            c_messages.push(new messages.StateMove(controller.scope.client_id,
                                                   states[j].id,
                                                   states[j].x,
                                                   states[j].y,
                                                   previous_x,
                                                   previous_y));
        }

        controller.scope.send_control_message(new messages.MultipleMessage(controller.scope.client_id, c_messages));
    }
    controller.scope.pressedScaledX = controller.scope.scaledX;
    controller.scope.pressedScaledY = controller.scope.scaledY;
};

_Move.prototype.onTouchMove = _Move.prototype.onMouseMove;
