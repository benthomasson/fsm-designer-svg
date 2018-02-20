# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0003_auto_20180220_2028'),
    ]

    operations = [
        migrations.CreateModel(
            name='Channel',
            fields=[
                ('channel_id', models.AutoField(serialize=False, primary_key=True)),
                ('label', models.CharField(max_length=200)),
                ('inbox', models.CharField(max_length=200)),
                ('outbox', models.CharField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='FiniteStateMachine',
            fields=[
                ('finite_state_machine_id', models.AutoField(serialize=False, primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('x1', models.IntegerField()),
                ('y1', models.IntegerField()),
                ('x2', models.IntegerField()),
                ('y2', models.IntegerField()),
                ('diagram', models.ForeignKey(to='prototype.Diagram')),
            ],
        ),
        migrations.CreateModel(
            name='FiniteStateMachineState',
            fields=[
                ('finite_state_machine_state_id', models.AutoField(serialize=False, primary_key=True)),
                ('finite_state_machine', models.ForeignKey(to='prototype.FiniteStateMachine')),
                ('state', models.ForeignKey(to='prototype.State')),
            ],
        ),
        migrations.AddField(
            model_name='channel',
            name='from_fsm',
            field=models.ForeignKey(related_name='from_channel', to='prototype.FiniteStateMachine'),
        ),
        migrations.AddField(
            model_name='channel',
            name='to_fsm',
            field=models.ForeignKey(related_name='to_channel', to='prototype.FiniteStateMachine'),
        ),
    ]
