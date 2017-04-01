

function serialize(message) {
    return JSON.stringify([message.constructor.name, message]);
}
exports.serialize = serialize;

function StateMove(sender, id, x, y, previous_x, previous_y) {
    this.sender = sender;
    this.id = id;
    this.x = x;
    this.y = y;
    this.previous_x = previous_x;
    this.previous_y = previous_y;
}
exports.StateMove = StateMove;

function StateCreate(sender, id, x, y, label) {
    this.sender = sender;
    this.id = id;
    this.x = x;
    this.y = y;
    this.label = label;
}
exports.StateCreate = StateCreate;

function StateDestroy(sender, id, previous_x, previous_y, previous_label) {
    this.sender = sender;
    this.id = id;
    this.previous_x = previous_x;
    this.previous_y = previous_y;
    this.previous_label = previous_label;
}
exports.StateDestroy = StateDestroy;

function StateLabelEdit(sender, id, label, previous_label) {
    this.sender = sender;
    this.id = id;
    this.label = label;
    this.previous_label = previous_label;
}
exports.StateLabelEdit = StateLabelEdit;


function StateSelected(sender, id) {
    this.sender = sender;
    this.id = id;
}
exports.StateSelected = StateSelected;

function StateUnSelected(sender, id) {
    this.sender = sender;
    this.id = id;
}
exports.StateUnSelected = StateUnSelected;

function TransitionCreate(sender, from_id, to_id, label) {
    this.sender = sender;
    this.from_id = from_id;
    this.to_id = to_id;
    this.label = label;
}
exports.TransitionCreate = TransitionCreate;

function TransitionDestroy(sender, from_id, to_id) {
    this.sender = sender;
    this.from_id = from_id;
    this.to_id = to_id;
}
exports.TransitionDestroy = TransitionDestroy;

function TransitionLabelEdit(sender, id, label, previous_label) {
    this.sender = sender;
    this.id = id;
    this.label = label;
    this.previous_label = previous_label;
}
exports.TransitionLabelEdit = TransitionLabelEdit;

function TransitionSelected(sender, id) {
    this.sender = sender;
    this.id = id;
}
exports.TransitionSelected = TransitionSelected;

function TransitionUnSelected(sender, id) {
    this.sender = sender;
    this.id = id;
}
exports.TransitionUnSelected = TransitionUnSelected;

function Undo(sender, original_message) {
    this.sender = sender;
    this.original_message = original_message;
}
exports.Undo = Undo;

function Redo(sender, original_message) {
    this.sender = sender;
    this.original_message = original_message;
}
exports.Redo = Redo;
