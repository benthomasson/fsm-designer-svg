# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0005_auto_20180220_2224'),
    ]

    operations = [
        migrations.AddField(
            model_name='diagram',
            name='uuid',
            field=models.CharField(default='0', max_length=40),
            preserve_default=False,
        ),
    ]
