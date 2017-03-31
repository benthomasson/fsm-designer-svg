# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0003_remove_finitestatemachine_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='state',
            name='x',
            field=models.IntegerField(default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='state',
            name='y',
            field=models.IntegerField(default=0),
            preserve_default=False,
        ),
    ]
