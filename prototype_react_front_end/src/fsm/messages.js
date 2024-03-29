

function StateMove(sender, id, x, y, previous_x, previous_y) {
    this.msg_type = "StateMove";
    this.sender = sender;
    this.id = id;
    this.x = x;
    this.y = y;
    this.previous_x = previous_x;
    this.previous_y = previous_y;
}
exports.StateMove = StateMove;

function StateCreate(sender, id, x, y, label) {
    this.msg_type = "StateCreate";
    this.sender = sender;
    this.id = id;
    this.x = x;
    this.y = y;
    this.label = label;
}
exports.StateCreate = StateCreate;

function StateDestroy(sender, id, previous_x, previous_y, previous_label) {
    this.msg_type = "StateDestroy";
    this.sender = sender;
    this.id = id;
    this.previous_x = previous_x;
    this.previous_y = previous_y;
    this.previous_label = previous_label;
}
exports.StateDestroy = StateDestroy;

function StateLabelEdit(sender, id, label, previous_label) {
    this.msg_type = "StateLabelEdit";
    this.sender = sender;
    this.id = id;
    this.label = label;
    this.previous_label = previous_label;
}
exports.StateLabelEdit = StateLabelEdit;

function StateSelected(sender, id) {
    this.msg_type = "StateSelected";
    this.sender = sender;
    this.id = id;
}
exports.StateSelected = StateSelected;

function StateUnSelected(sender, id) {
    this.msg_type = "StateUnSelected";
    this.sender = sender;
    this.id = id;
}
exports.StateUnSelected = StateUnSelected;

function TransitionCreate(sender, id, from_id, to_id, label) {
    this.msg_type = "TransitionCreate";
    this.sender = sender;
    this.id = id;
    this.from_id = from_id;
    this.to_id = to_id;
    this.label = label;
}
exports.TransitionCreate = TransitionCreate;

function TransitionDestroy(sender, id, from_id, to_id, label) {
    this.msg_type = "TransitionDestroy";
    this.sender = sender;
    this.id = id;
    this.from_id = from_id;
    this.to_id = to_id;
    this.label = label;
}
exports.TransitionDestroy = TransitionDestroy;

function TransitionLabelEdit(sender, id, label, previous_label) {
    this.msg_type = "TransitionLabelEdit";
    this.sender = sender;
    this.id = id;
    this.label = label;
    this.previous_label = previous_label;
}
exports.TransitionLabelEdit = TransitionLabelEdit;

function TransitionSelected(sender, id) {
    this.msg_type = "TransitionSelected";
    this.sender = sender;
    this.id = id;
}
exports.TransitionSelected = TransitionSelected;

function TransitionUnSelected(sender, id) {
    this.msg_type = "TransitionUnSelected";
    this.sender = sender;
    this.id = id;
}
exports.TransitionUnSelected = TransitionUnSelected;

function ChannelCreate(sender, id, from_id, to_id, label) {
    this.msg_type = "ChannelCreate";
    this.sender = sender;
    this.id = id;
    this.from_id = from_id;
    this.to_id = to_id;
    this.label = label;
}
exports.ChannelCreate = ChannelCreate;

function ChannelDestroy(sender, id, from_id, to_id, label) {
    this.msg_type = "ChannelDestroy";
    this.sender = sender;
    this.id = id;
    this.from_id = from_id;
    this.to_id = to_id;
    this.label = label;
}
exports.ChannelDestroy = ChannelDestroy;

function ChannelLabelEdit(sender, id, label, previous_label) {
    this.msg_type = "ChannelLabelEdit";
    this.sender = sender;
    this.id = id;
    this.label = label;
    this.previous_label = previous_label;
}
exports.ChannelLabelEdit = ChannelLabelEdit;

function ChannelSelected(sender, id) {
    this.msg_type = "ChannelSelected";
    this.sender = sender;
    this.id = id;
}
exports.ChannelSelected = ChannelSelected;

function ChannelUnSelected(sender, id) {
    this.msg_type = "ChannelUnSelected";
    this.sender = sender;
    this.id = id;
}
exports.ChannelUnSelected = ChannelUnSelected;

function NewGroup(type) {
    this.type = type;
}
exports.NewGroup = NewGroup;

function GroupMove(sender, id, x1, y1, x2, y2, previous_x1, previous_y1, previous_x2, previous_y2) {
    this.msg_type = "GroupMove";
    this.sender = sender;
    this.id = id;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.previous_x1 = previous_x1;
    this.previous_y1 = previous_y1;
    this.previous_x2 = previous_x2;
    this.previous_y2 = previous_y2;
}
exports.GroupMove = GroupMove;

function GroupCreate(sender, id, x1, y1, x2, y2, name, type) {
    this.msg_type = "GroupCreate";
    this.sender = sender;
    this.id = id;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.name = name;
    this.type = type;
}
exports.GroupCreate = GroupCreate;

function GroupDestroy(sender, id, previous_x1, previous_y1, previous_x2, previous_y2, previous_name, previous_type) {
    this.msg_type = "GroupDestroy";
    this.sender = sender;
    this.id = id;
    this.previous_x1 = previous_x1;
    this.previous_y1 = previous_y1;
    this.previous_x2 = previous_x2;
    this.previous_y2 = previous_y2;
    this.previous_name = previous_name;
    this.previous_type = previous_type;
}
exports.GroupDestroy = GroupDestroy;

function GroupLabelEdit(sender, id, name, previous_name) {
    this.msg_type = "GroupLabelEdit";
    this.sender = sender;
    this.id = id;
    this.name = name;
    this.previous_name = previous_name;
}
exports.GroupLabelEdit = GroupLabelEdit;

function GroupSelected(sender, id) {
    this.msg_type = "GroupSelected";
    this.sender = sender;
    this.id = id;
}
exports.GroupSelected = GroupSelected;

function GroupUnSelected(sender, id) {
    this.msg_type = "GroupUnSelected";
    this.sender = sender;
    this.id = id;
}
exports.GroupUnSelected = GroupUnSelected;

function GroupMembership(sender, id, members) {
    this.msg_type = "GroupMembership";
    this.sender = sender;
    this.id = id;
    this.members = members;
}
exports.GroupMembership = GroupMembership;
