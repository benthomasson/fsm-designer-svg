# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0006_transition_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='finitestatemachine',
            name='state_id_seq',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='finitestatemachine',
            name='transition_id_seq',
            field=models.IntegerField(default=0),
        ),
    ]
