# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0011_auto_20171205_1808'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='FiniteStateMachine',
            new_name='Diagram',
        ),
        migrations.RenameField(
            model_name='diagram',
            old_name='finite_state_machine_id',
            new_name='diagram_id',
        ),
        migrations.RenameField(
            model_name='history',
            old_name='finite_state_machine',
            new_name='diagram',
        ),
        migrations.RenameField(
            model_name='state',
            old_name='finite_state_machine',
            new_name='diagram',
        ),
        migrations.AlterField(
            model_name='history',
            name='diagram',
            field=models.ForeignKey(to='prototype.FiniteStateMachine', to_field='diagram_id'),
        ),
        migrations.AlterField(
            model_name='state',
            name='diagram',
            field=models.ForeignKey(to='prototype.FiniteStateMachine', to_field='diagram_id'),
        ),
    ]
