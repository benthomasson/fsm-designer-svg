from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
import yaml
from prototype.models import FiniteStateMachine, State, Transition

from functools import partial


from django import forms


class FSMForm(forms.Form):
    finite_state_machine_id = forms.IntegerField()


class UploadFileForm(forms.Form):
    file = forms.FileField()

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


def download(request):
    data = dict(states=[], transitions=[])
    form = FSMForm(request.GET)
    if form.is_valid():
        finite_state_machine_id = form.cleaned_data['finite_state_machine_id']
        fsm = FiniteStateMachine.objects.get(pk=finite_state_machine_id)
        data['name'] = fsm.name
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


def upload_fsm(data):
    fsm = FiniteStateMachine()
    fsm.name = data.get('name', data.get("app", "fsm"))
    fsm.save()
    states = []
    transitions = []
    for i, state in enumerate(data.get('states', [])):
        new_state = State(finite_state_machine_id=fsm.pk,
                          name=state.get('label'),
                          id=i + 1,
                          x=state.get('x', 0),
                          y=state.get('y', 0))
        states.append(new_state)
    State.objects.bulk_create(states)
    states_map = dict(State.objects
                           .filter(finite_state_machine_id=fsm.pk)
                           .values_list("name", "pk"))
    for transition in data.get('transitions', []):
        new_transition = Transition(label=transition['label'],
                                    from_state_id=states_map[transition['from_state']],
                                    to_state_id=states_map[transition['to_state']])
        transitions.append(new_transition)

    Transition.objects.bulk_create(transitions)
    return fsm.pk


def upload(request):
    if request.method == 'POST':
        print request.POST
        print request.FILES
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            data = yaml.load(request.FILES['file'].read())
            fsm_id = upload_fsm(data)
            return HttpResponseRedirect('/static/prototype/index.html#!?finite_state_machine_id={0}'.format(fsm_id))
    else:
        form = UploadFileForm()
    return render(request, 'prototype/upload.html', {'form': form})
