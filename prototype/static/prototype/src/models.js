var fsm = require('./fsm.js');
var button = require('./button.js');
var util = require('./util.js');
var math = require('mathjs');

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
    //Return the slope in degrees for this transition.
    var x1 = this.from_state.x;
    var y1 = this.from_state.y;
    var x2 = this.to_state.x;
    var y2 = this.to_state.y;
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 180;
};

Transition.prototype.pslope = function () {
    //Return the slope of a perpendicular line to this
    //transition
    var x1 = this.from_state.x;
    var y1 = this.from_state.y;
    var x2 = this.to_state.x;
    var y2 = this.to_state.y;
    var slope = (y2 - y1)/(x2 - x1);
    //var intercept = - slope * x1;
    var pslope = 1/slope;
    return Math.atan(pslope)  * 180 / Math.PI + 180;
};

function pDistance(x, y, x1, y1, x2, y2) {
  //Code from http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
  //Joshua
  // Find the dot product of two vectors <A, B>, <C, D>
  // Divide by the length squared of <C, D>
  // Use scalar project to find param
  //

  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;

  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = -1;
  if (len_sq !== 0) {
	  //in case of 0 length line
      param = dot / len_sq;
  }

  var xx, yy;

  //Find a point xx, yy where the projection and the <C, D> vector intersect.
  //If less than 0 use x1, y1 as the closest point.
  //If less than 1 use x2, y2 as the closest point.
  //If between 0 and 1 use the projection intersection xx, yy
  if (param < 0) {
    xx = x1;
    yy = y1;
  }
  else if (param > 1) {
    xx = x2;
    yy = y2;
  }
  else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  var dx = x - xx;
  var dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function cross_z_pos(x, y, x1, y1, x2, y2) {
  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;

  return math.cross([A, B, 0], [C, D, 0])[2] > 0;
}

Transition.prototype.perpendicular = function (x, y) {
    //Find the perpendicular line through x, y to this transition.
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
    // Is the distance to the mouse location less than 25 if on the label side
    // or 5 on the other from the shortest line to the transition?
	var d = pDistance(x, y, this.from_state.x, this.from_state.y, this.to_state.x, this.to_state.y);
    if (cross_z_pos(x, y, this.from_state.x, this.from_state.y, this.to_state.x, this.to_state.y)) {
        return d < 25;
    } else {
        return d < 5;
    }
};

Transition.prototype.length = function () {
    //Return the length of this transition.
    var x1 = this.from_state.x;
    var y1 = this.from_state.y;
    var x2 = this.to_state.x;
    var y2 = this.to_state.y;
    return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
};


Transition.prototype.inter_length = function () {
    //Return the length of this transition between states.
    return this.length() - this.from_state.size - this.to_state.size;
};

Transition.prototype.arc_r = function () {
    return this.inter_length();
};

Transition.prototype.arc_r2 = function () {
    return this.length();
};

Transition.prototype.arc_offset = function () {
    var r = this.arc_r();
    var offset =  r - (Math.sin(this.arc_angle_rad()) * r);
    return offset;
};

Transition.prototype.arc_offset2 = function () {
    var r = this.arc_r2();
    var theta = Math.acos((this.length() / 2) / r);
    var offset =  r * (1 - Math.sin(theta));
    return offset;
};

Transition.prototype.arc_angle_rad = function () {
    return Math.acos((this.inter_length() / 2) / this.arc_r());
};

Transition.prototype.arc_angle_tan_rad = function () {
    return Math.PI/2 - Math.acos((this.inter_length() / 2) / this.arc_r());
};

Transition.prototype.arc_angle_tan = function () {
    return this.arc_angle_tan_rad() * 180 / Math.PI;
};

Transition.prototype.arc_angle_tan_rad2 = function () {
    var r = this.arc_r2();
    var l = this.length();
    var phi = this.end_arc_angle_rad();
    return Math.PI/2 - Math.acos((l/2 - Math.cos(phi) * this.to_state.size) / r);
};

Transition.prototype.arc_angle_tan2 = function () {
    return this.arc_angle_tan_rad2() * 180 / Math.PI;
};

Transition.prototype.end_arc_angle_rad = function () {
    var r = this.arc_r2();
    var l = this.length();
    return Math.acos((this.to_state.size / 2) / r) - Math.acos((l/2)/r);
};

Transition.prototype.end_arc_angle = function () {
    return this.end_arc_angle_rad() * 180 / Math.PI;
};

Transition.prototype.start_arc_angle_rad = function () {
    return Math.acos((this.from_state.size / 2) / this.arc_r2()) - Math.acos((this.length()/2)/this.arc_r2());
};

Transition.prototype.start_arc_angle = function () {
    return this.start_arc_angle_rad() * 180 / Math.PI;
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

