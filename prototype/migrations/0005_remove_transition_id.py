# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0004_auto_20170331_1357'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='transition',
            name='id',
        ),
    ]
