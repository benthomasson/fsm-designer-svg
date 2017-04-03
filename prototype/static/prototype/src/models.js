var fsm = require('./fsm.js');
var button = require('./button.js');
var util = require('./util.js');

function State(id, label, x, y) {
    this.id = id;
    this.label = label;
    this.x = x;
    this.y = y;
    this.height = 50;
    this.width = 50;
    this.size = 50;
    this.type = 'state';
    this.selected = false;
    this.remote_selected = false;
    this.edit_label = false;
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
            label: this.label,
            x: this.x,
            y: this.y};

};

function Transition(id, from_state, to_state, label) {
    this.id = id;
    this.from_state = from_state;
    this.to_state = to_state;
    this.selected = false;
    this.remote_selected = false;
    this.label = label;
}
exports.Transition = Transition;

Transition.prototype.toJSON = function () {
    return {to_state: this.to_state.id,
            from_state: this.from_state.id};
};

Transition.prototype.slope = function () {
    var x1 = this.from_state.x;
    var y1 = this.from_state.y;
    var x2 = this.to_state.x;
    var y2 = this.to_state.y;
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 180;
};

Transition.prototype.pslope = function () {
    var x1 = this.from_state.x;
    var y1 = this.from_state.y;
    var x2 = this.to_state.x;
    var y2 = this.to_state.y;
    var slope = (y2 - y1)/(x2 - x1);
    //var intercept = - slope * x1;
    var pslope = 1/slope;
    return Math.atan(pslope)  * 180 / Math.PI + 180;
};

Transition.prototype.perpendicular = function (x, y) {
    var x1 = this.from_state.x;
    var y1 = this.from_state.y;
    var x2 = this.to_state.x;
    var y2 = this.to_state.y;
    var slope = (y2 - y1)/(x2 - x1);
    var intercept = y1 - slope * x1;
    var pslope = -1/slope;
    var pintercept = y - pslope * x;

    var xi = (pintercept - intercept) / (slope - pslope);
    var yi = pslope * xi + pintercept;
    return {x1:x, y1:y, x2: xi, y2: yi};
};

Transition.prototype.is_selected = function (x, y) {

    var line = this.perpendicular(x, y);
    return Math.sqrt(Math.pow(line.x1-line.x2, 2) + Math.pow(line.y1-line.y2, 2)) < 10;
};

Transition.prototype.length = function () {
    var x1 = this.from_state.x;
    var y1 = this.from_state.y;
    var x2 = this.to_state.x;
    var y2 = this.to_state.y;
    return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
};

function Button(label, x, y, width, height, callback) {
    this.label = label;
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

