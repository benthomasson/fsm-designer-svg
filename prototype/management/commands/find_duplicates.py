

from django.core.management.base import BaseCommand
from django.db.models import Count

from prototype.models import State
from pprint import pprint


class Command(BaseCommand):

    def handle(self, *args, **options):
        dups = list(State.objects
                         .values('diagram_id', 'id')
                         .annotate(Count('pk'))
                         .order_by()
                         .filter(pk__count__gt=1))
        pprint(dups)
        for dup in dups:
            del dup['pk__count']
            pprint(list(State.objects
                             .filter(**dup)
                             .values()))
