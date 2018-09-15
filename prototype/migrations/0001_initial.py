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
    ]

    operations = [
        migrations.CreateModel(
            name='Client',
            fields=[
                ('client_id', models.AutoField(serialize=False, primary_key=True)),
            ],
        ),
        migrations.CreateModel(
            name='Diagram',
            fields=[
                ('diagram_id', models.AutoField(serialize=False, primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('state_id_seq', models.IntegerField(default=0)),
                ('transition_id_seq', models.IntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='FSMTrace',
            fields=[
                ('fsm_trace_id', models.AutoField(serialize=False, primary_key=True)),
                ('fsm_name', models.CharField(max_length=200)),
                ('from_state', models.CharField(max_length=200)),
                ('to_state', models.CharField(max_length=200)),
                ('message_type', models.CharField(max_length=200)),
                ('trace_session_id', models.IntegerField(default=0)),
                ('client', models.ForeignKey(to='prototype.Client', on_delete=models.CASCADE)),
            ],
        ),
        migrations.CreateModel(
            name='FSMTraceReplay',
            fields=[
                ('fsm_trace_replay_id', models.AutoField(serialize=False, primary_key=True)),
                ('replay_data', models.TextField()),
            ],
        ),
        migrations.CreateModel(
            name='History',
            fields=[
                ('history_id', models.AutoField(serialize=False, primary_key=True)),
                ('message_id', models.IntegerField()),
                ('message_data', models.TextField()),
                ('undone', models.BooleanField(default=False)),
                ('client', models.ForeignKey(to='prototype.Client', on_delete=models.CASCADE)),
                ('diagram', models.ForeignKey(to='prototype.Diagram', on_delete=models.CASCADE)),
            ],
        ),
        migrations.CreateModel(
            name='MessageType',
            fields=[
                ('message_type_id', models.AutoField(serialize=False, primary_key=True)),
                ('name', models.CharField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='State',
            fields=[
                ('state_id', models.AutoField(serialize=False, primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('id', models.IntegerField()),
                ('x', models.IntegerField()),
                ('y', models.IntegerField()),
                ('diagram', models.ForeignKey(to='prototype.Diagram', on_delete=models.CASCADE)),
            ],
        ),
        migrations.CreateModel(
            name='Transition',
            fields=[
                ('transition_id', models.AutoField(serialize=False, primary_key=True)),
                ('label', models.CharField(max_length=200)),
                ('id', models.IntegerField()),
                ('from_state', models.ForeignKey(related_name='from_transition', to='prototype.State', on_delete=models.CASCADE)),
                ('to_state', models.ForeignKey(related_name='to_transition', to='prototype.State', on_delete=models.CASCADE)),
            ],
        ),
        migrations.AddField(
            model_name='history',
            name='message_type',
            field=models.ForeignKey(to='prototype.MessageType', on_delete=models.CASCADE),
        ),
        migrations.RunPython(
            code=populate_message_types,
        ),
    ]
