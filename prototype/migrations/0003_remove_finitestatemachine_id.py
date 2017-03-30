# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0002_auto_20170330_1930'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='finitestatemachine',
            name='id',
        ),
    ]
