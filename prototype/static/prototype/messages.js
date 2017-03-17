

function serialize(message) {
    return JSON.stringify([message.constructor.name, message]);
}
exports.serialize = serialize;

function DeviceMove(sender, id, x, y) {
    this.sender = sender;
    this.id = id;
    this.x = x;
    this.y = y;
}
exports.DeviceMove = DeviceMove;

function DeviceCreate(sender, id, x, y, name, type) {
    this.sender = sender;
    this.id = id;
    this.x = x;
    this.y = y;
    this.name = name;
    this.type = type;
}
exports.DeviceCreate = DeviceCreate;

function DeviceDestroy(sender, id) {
    this.sender = sender;
    this.id = id;
}
exports.DeviceDestroy = DeviceDestroy;

function DeviceLabelEdit(sender, id, name) {
    this.sender = sender;
    this.id = id;
    this.name = name;
}
exports.DeviceLabelEdit = DeviceLabelEdit;

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
