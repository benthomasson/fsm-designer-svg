var fsm = require('./fsm.js');
var button = require('./button.js');

function Device(name, x, y, type) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.size = 50;
    this.type = type;
    this.selected = false;
    this.edit_label = false;
}
exports.Device = Device;

Device.prototype.is_selected = function (x, y) {

    return (x > this.x - this.size &&
            x < this.x + this.size &&
            y > this.y - this.size &&
            y < this.y + this.size);

};

function Link(from_device, to_device, selected) {
    this.from_device = from_device;
    this.to_device = to_device;
    this.selected = selected;
}
exports.Link = Link;

function Button(name, x, y, width, height, callback) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.callback = callback;
    this.is_pressed = false;
    this.mouse_over = false;
    this.fsm = new fsm.FSMController(this, button.Start, null);
}
exports.Button = Button;


Button.prototype.is_selected = function (x, y) {

    return (x > this.x &&
            x < this.x + this.width &&
            y > this.y &&
            y < this.y + this.height);

};

