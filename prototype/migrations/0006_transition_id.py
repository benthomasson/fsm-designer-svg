# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0005_remove_transition_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='transition',
            name='id',
            field=models.IntegerField(default=0),
            preserve_default=False,
        ),
    ]
