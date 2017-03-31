from django.http import HttpResponse
import yaml
from prototype.models import FiniteStateMachine, State, Transition

from functools import partial


from django import forms


class FSMForm(forms.Form):
    finite_state_machine_id = forms.IntegerField()

# Create your views here.


def index(request):
    return HttpResponse("")


state_map = dict(x='x',
                 y='y',
                 name='label',
                 id='id')

transition_map = dict(from_state__name="from_state",
                      to_state__name="to_state",
                      label="label")


def transform_dict(dict_map, d):
    return {to_key: d[from_key] for from_key, to_key in dict_map.iteritems()}


transform_state = partial(transform_dict, state_map)
transform_transition = partial(transform_dict, transition_map)


def fsm(request):
    data = dict(states=[], transitions=[])
    form = FSMForm(request.GET)
    if form.is_valid():
        finite_state_machine_id = form.cleaned_data['finite_state_machine_id']
        fsm = FiniteStateMachine.objects.get(pk=finite_state_machine_id)
        data['finite_state_machine_id'] = fsm.pk
        data['states'] = map(transform_state, list(State.objects
                                                        .filter(finite_state_machine_id=finite_state_machine_id)
                                                        .values('x',
                                                                'y',
                                                                'name',
                                                                'id')))
        data['transitions'] = map(transform_transition, list(Transition.objects
                                                                       .filter(from_state__finite_state_machine_id=finite_state_machine_id)
                                                                       .values('from_state__name',
                                                                               'to_state__name',
                                                                               'label')))
        response = HttpResponse(yaml.safe_dump(data, default_flow_style=False),
                                content_type="application/force-download")
        response['Content-Disposition'] = 'attachment; filename="{0}.yml"'.format(fsm.name)
        return response
    else:
        return HttpResponse(form.errors)
