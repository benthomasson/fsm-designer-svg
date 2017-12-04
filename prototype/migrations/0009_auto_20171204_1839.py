# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0008_auto_20171204_1827'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='tracesession',
            name='client',
        ),
        migrations.RemoveField(
            model_name='fsmtrace',
            name='trace_session',
        ),
        migrations.AddField(
            model_name='fsmtrace',
            name='client',
            field=models.ForeignKey(default=1, to='prototype.Client'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='fsmtrace',
            name='trace_session_id',
            field=models.IntegerField(default=0),
        ),
        migrations.DeleteModel(
            name='TraceSession',
        ),
    ]
