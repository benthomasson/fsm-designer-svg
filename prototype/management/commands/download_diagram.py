

from django.core.management.base import BaseCommand

import yaml

from prototype.models import Diagram, State, Transition
from prototype.views import transform_state, transform_transition


class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument("diagram_uuid", type=str)

    def handle(self, *args, **options):
        data = dict(states=[], transitions=[])
        diagram_uuid = options['diagram_uuid']
        diagram = Diagram.objects.get(uuid=diagram_uuid)
        data['name'] = diagram.name
        data['diagram_uuid'] = diagram.uuid
        states = State.objects.filter(diagram_id=diagram.pk)
        data['states'] = list(map(transform_state, list(states.filter(diagram_id=diagram.pk)
                                                        .values('x',
                                                                'y',
                                                                'name',
                                                                'id')
                                                        .order_by('name'))))
        state_pks = states.values_list('state_id', flat=True)
        data['transitions'] = list(map(transform_transition, list(Transition.objects
                                                                  .filter(from_state_id__in=state_pks)
                                                                  .filter(to_state_id__in=state_pks)
                                                                  .values('from_state__name',
                                                                          'to_state__name',
                                                                          'label')
                                                                  .order_by('from_state__name', 'label'))))
        print(yaml.safe_dump(data, default_flow_style=False))
