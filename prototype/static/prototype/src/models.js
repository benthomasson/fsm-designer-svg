var fsm = require('./fsm.js');
var button = require('./button.js');
var util = require('./util.js');

function State(id, name, x, y, type) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.height = type === "host" ? 15 : 50;
    this.width = 50;
    this.type = type;
    this.selected = false;
    this.remote_selected = false;
    this.edit_label = false;
    this.status = null;
    this.frame = 10;
}
exports.State = State;

State.prototype.incr_frame = function ( ) {
    this.frame = this.frame + 1;
};

State.prototype.describeArc = util.describeArc;

State.prototype.is_selected = function (x, y) {

    return (x > this.x - this.width &&
            x < this.x + this.width &&
            y > this.y - this.height &&
            y < this.y + this.height);

};


State.prototype.toJSON = function () {
    return {id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            size: this.size,
            type: this.type};

};

function Transition(from_state, to_state) {
    this.from_state = from_state;
    this.to_state = to_state;
    this.selected = false;
    this.status = null;
}
exports.Transition = Transition;

Transition.prototype.toJSON = function () {
    return {to_state: this.to_state.id,
            from_state: this.from_state.id};
};

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

