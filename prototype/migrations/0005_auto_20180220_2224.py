# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0004_auto_20180220_2047'),
    ]

    operations = [
        migrations.AddField(
            model_name='channel',
            name='id',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='diagram',
            name='channel_id_seq',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='diagram',
            name='fsm_id_seq',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='finitestatemachine',
            name='id',
            field=models.IntegerField(default=0),
        ),
    ]
