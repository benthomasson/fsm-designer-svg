# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0007_auto_20170703_1805'),
    ]

    operations = [
        migrations.CreateModel(
            name='FSMTrace',
            fields=[
                ('fsm_trace_id', models.AutoField(serialize=False, primary_key=True)),
                ('fsm_name', models.CharField(max_length=200)),
                ('from_state', models.CharField(max_length=200)),
                ('to_state', models.CharField(max_length=200)),
                ('message_type', models.CharField(max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='TraceSession',
            fields=[
                ('trace_session_id', models.AutoField(serialize=False, primary_key=True)),
                ('id', models.IntegerField(default=0)),
                ('client', models.ForeignKey(to='prototype.Client')),
            ],
        ),
        migrations.AddField(
            model_name='fsmtrace',
            name='trace_session',
            field=models.ForeignKey(to='prototype.TraceSession'),
        ),
    ]
