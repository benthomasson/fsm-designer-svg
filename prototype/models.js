function Device(x, y, size, selected) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.selected = selected;
}
exports.Device = Device;

Device.prototype.is_selected = function (x, y) {

    return (x > this.x - this.size &&
            x < this.x + this.size &&
            y > this.y - this.size &&
            y < this.y + this.size);

};

function Link(x1, y1, x2, y2, selected) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.selected = selected;
}
exports.Link = Link;



