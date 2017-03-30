

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

function StateCreate(sender, id, x, y, name, type) {
    this.sender = sender;
    this.id = id;
    this.x = x;
    this.y = y;
    this.name = name;
    this.type = type;
}
exports.StateCreate = StateCreate;

function StateDestroy(sender, id, previous_x, previous_y, previous_name, previous_type) {
    this.sender = sender;
    this.id = id;
    this.previous_x = previous_x;
    this.previous_y = previous_y;
    this.previous_name = previous_name;
    this.previous_type = previous_type;
}
exports.StateDestroy = StateDestroy;

function StateLabelEdit(sender, id, name, previous_name) {
    this.sender = sender;
    this.id = id;
    this.name = name;
    this.previous_name = previous_name;
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

function LinkCreate(sender, from_id, to_id) {
    this.sender = sender;
    this.from_id = from_id;
    this.to_id = to_id;
}
exports.LinkCreate = LinkCreate;

function LinkDestroy(sender, from_id, to_id) {
    this.sender = sender;
    this.from_id = from_id;
    this.to_id = to_id;
}
exports.LinkDestroy = LinkDestroy;

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
