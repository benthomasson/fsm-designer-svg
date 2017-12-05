# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import yaml

messages = yaml.load('''
messages:
    - {msg_type: StateMove, fields: [msg_type, sender, id, x, y, previous_x, previous_y]}
    - {msg_type: StateCreate, fields: [msg_type, sender, id, x, y, label]}
    - {msg_type: StateDestroy, fields: [msg_type, sender, id, previous_x, previous_y, previous_label]}
    - {msg_type: StateLabelEdit, fields: [msg_type, sender, id, label, previous_label]}
    - {msg_type: StateSelected, fields: [msg_type, sender, id]}
    - {msg_type: StateUnSelected, fields: [msg_type, sender, id]}
    - {msg_type: TransitionCreate, fields: [msg_type, sender, id, from_id, to_id, label]}
    - {msg_type: TransitionDestroy, fields: [msg_type, sender, id, from_id, to_id, label]}
    - {msg_type: TransitionLabelEdit, fields: [msg_type, sender, id, label, previous_label]}
    - {msg_type: TransitionSelected, fields: [msg_type, sender, id]}
    - {msg_type: TransitionUnSelected, fields: [msg_type, sender, id]}
    - {msg_type: Undo, fields: [msg_type, sender, original_message]}
    - {msg_type: Redo, fields: [msg_type, sender, original_message]}
    - {msg_type: FSMTrace, fields: [msg_type, sender, trace_id, fsm_name, from_state, to_state, recv_message_type]}
    - {msg_type: ChannelTrace, fields: [msg_type, sender, trace_id, from_fsm, to_fsm, sent_message_type]}
                     ''')


def populate_message_types(apps, schema_editor):

    MessageType = apps.get_model('prototype', 'MessageType')
    for message in messages['messages']:
        MessageType.objects.get_or_create(name=message['msg_type'])


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0010_fsmtracereplay'),
    ]

    operations = [
        migrations.RunPython(populate_message_types)
    ]
