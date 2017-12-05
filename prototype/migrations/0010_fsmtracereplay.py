# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0009_auto_20171204_1839'),
    ]

    operations = [
        migrations.CreateModel(
            name='FSMTraceReplay',
            fields=[
                ('fsm_trace_replay_id', models.AutoField(serialize=False, primary_key=True)),
                ('replay_data', models.TextField()),
            ],
        ),
    ]
