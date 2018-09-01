# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import uuid

def add_uuids(apps, schema_editor):

    Diagram = apps.get_model('prototype', 'Diagram')
    for diagram in Diagram.objects.filter(uuid='0'):
        diagram.uuid = uuid.uuid4()
        diagram.save()


class Migration(migrations.Migration):

    dependencies = [
        ('prototype', '0006_diagram_uuid'),
    ]

    operations = [
            migrations.RunPython(add_uuids),
    ]
