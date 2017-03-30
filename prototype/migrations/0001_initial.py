# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


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
            name='FiniteStateMachine',
            fields=[
                ('finite_state_machine_id', models.AutoField(serialize=False, primary_key=True)),
                ('name', models.CharField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='History',
            fields=[
                ('history_id', models.AutoField(serialize=False, primary_key=True)),
                ('message_id', models.IntegerField()),
                ('message_data', models.TextField()),
                ('undone', models.BooleanField(default=False)),
                ('client', models.ForeignKey(to='prototype.Client')),
                ('finite_state_machine', models.ForeignKey(to='prototype.FiniteStateMachine')),
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
                ('finite_state_machine', models.ForeignKey(to='prototype.FiniteStateMachine')),
            ],
        ),
        migrations.CreateModel(
            name='Transition',
            fields=[
                ('transition_id', models.AutoField(serialize=False, primary_key=True)),
                ('label', models.CharField(max_length=200)),
                ('from_state', models.ForeignKey(related_name='from_transition', to='prototype.State')),
                ('to_state', models.ForeignKey(related_name='to_transition', to='prototype.State')),
            ],
        ),
        migrations.AddField(
            model_name='history',
            name='message_type',
            field=models.ForeignKey(to='prototype.MessageType'),
        ),
    ]
