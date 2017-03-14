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

function Link(from_device, to_device, selected) {
    this.from_device = from_device;
    this.to_device = to_device;
    this.selected = selected;
}
exports.Link = Link;



