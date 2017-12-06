# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='fsmtrace',
            name='order',
            field=models.IntegerField(default=0),
        ),
    ]
