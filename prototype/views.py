from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.http import JsonResponse
import yaml
import json
from prototype.models import Diagram, State, Transition, FSMTrace, FSMTraceReplay
from prototype.models import FiniteStateMachine, Channel

from functools import partial


from django import forms


class DiagramForm(forms.Form):
    diagram_id = forms.IntegerField()

class DiagramFSMForm(forms.Form):
    diagram_id = forms.IntegerField()
    finite_state_machine_id = forms.IntegerField(required=False)

class UploadFileForm(forms.Form):
    file = forms.FileField()

# Create your views here.


def index(request):
    return render(request, "prototype/index.html", dict(diagrams=Diagram.objects.all().order_by('-pk')))


state_map = dict(x='x',
                 y='y',
                 name='label',
                 id='id')

transition_map = dict(from_state__name="from_state",
                      to_state__name="to_state",
                      label="label")

channel_map = dict(from_fsm__name="from_fsm",
                   to_fsm__name="to_fsm",
                   from_fsm__id="from_fsm_id",
                   to_fsm__id="to_fsm_id",
                   inbox="inbox",
                   outbox="outbox",
                   label="type")


def transform_dict(dict_map, d):
    return {to_key: d[from_key] for from_key, to_key in dict_map.iteritems()}


transform_state = partial(transform_dict, state_map)
transform_transition = partial(transform_dict, transition_map)
transform_channel = partial(transform_dict, channel_map)


def download(request):
    data = dict(states=[], transitions=[])
    form = DiagramFSMForm(request.GET)
    if form.is_valid():
        diagram_id = form.cleaned_data['diagram_id']
        finite_state_machine_id = form.cleaned_data['finite_state_machine_id'] or 0
        diagram = Diagram.objects.get(pk=diagram_id)
        data['name'] = diagram.name
        data['diagram_id'] = diagram.pk
        if finite_state_machine_id > 0:
            states = State.objects.filter(diagram_id=diagram_id, finitestatemachinestate__finite_state_machine__id=finite_state_machine_id)
            data['finite_state_machine_id'] = finite_state_machine_id
            data['name'] = FiniteStateMachine.objects.filter(diagram_id=diagram_id, id=finite_state_machine_id).values_list('name', flat=True)[0]
        else:
            states = State.objects.filter(diagram_id=diagram_id)
        data['states'] = map(transform_state, list(states.filter(diagram_id=diagram_id)
                                                         .values('x',
                                                                 'y',
                                                                 'name',
                                                                 'id')
                                                         .order_by('name')))
        data['transitions'] = map(transform_transition, list(Transition.objects
                                                                       .filter(from_state__diagram_id=diagram_id)
                                                                       .values('from_state__name',
                                                                               'to_state__name',
                                                                               'label')
                                                                       .order_by('from_state__name', 'label')))
        response = HttpResponse(yaml.safe_dump(data, default_flow_style=False),
                                content_type="application/force-download")
        response['Content-Disposition'] = 'attachment; filename="{0}.yml"'.format(diagram.name)
        return response
    else:
        return HttpResponse(form.errors)


def download_pipeline(request):
    data = dict(states=[], transitions=[])
    form = DiagramForm(request.GET, initial={'finite_state_machine_id': 0})
    if form.is_valid():
        diagram_id = form.cleaned_data['diagram_id']
        diagram = Diagram.objects.get(pk=diagram_id)
        data['name'] = diagram.name
        data['diagram_id'] = diagram.pk
        data['fsms'] = list(FiniteStateMachine.objects
                                              .filter(diagram_id=diagram_id)
                                              .values('x1',
                                                      'y1',
                                                      'x2',
                                                      'y2',
                                                      'name',
                                                      'id'))
        data['channels'] = map(transform_channel, list(Channel.objects
                                                              .filter(from_fsm__diagram_id=diagram_id)
                                                              .values('from_fsm__name',
                                                                      'to_fsm__name',
                                                                      'from_fsm__id',
                                                                      'to_fsm__id',
                                                                      'inbox',
                                                                      'outbox',
                                                                      'label')))
        response = HttpResponse(yaml.safe_dump(data, default_flow_style=False),
                                content_type="application/force-download")
        response['Content-Disposition'] = 'attachment; filename="{0}.yml"'.format(diagram.name)
        return response
    else:
        return HttpResponse(form.errors)


def upload_diagram(data):
    diagram = Diagram()
    diagram.name = data.get('name', data.get("app", "diagram"))
    diagram.save()
    states = []
    transitions = []
    for i, state in enumerate(data.get('states', [])):
        new_state = State(diagram_id=diagram.pk,
                          name=state.get('label'),
                          id=i + 1,
                          x=state.get('x', 0),
                          y=state.get('y', 0))
        states.append(new_state)
    State.objects.bulk_create(states)
    states_map = dict(State.objects
                           .filter(diagram_id=diagram.pk)
                           .values_list("name", "pk"))
    for i, transition in enumerate(data.get('transitions', [])):
        new_transition = Transition(label=transition['label'],
                                    id=i + 1,
                                    from_state_id=states_map[transition['from_state']],
                                    to_state_id=states_map[transition['to_state']])
        transitions.append(new_transition)

    Transition.objects.bulk_create(transitions)
    diagram.state_id_seq = len(states)
    diagram.transition_id_seq = len(transitions)
    diagram.save()
    return diagram.pk


def upload(request):
    if request.method == 'POST':
        print request.POST
        print request.FILES
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            data = yaml.load(request.FILES['file'].read())
            diagram_id = upload_diagram(data)
            return HttpResponseRedirect('/static/prototype/index.html#!?diagram_id={0}'.format(diagram_id))
    else:
        form = UploadFileForm()
    return render(request, 'prototype/upload.html', {'form': form})


class FSMTraceForm(forms.Form):
    diagram_id = forms.IntegerField()
    trace_id = forms.IntegerField()
    client_id = forms.IntegerField()


def download_trace(request):
    form = FSMTraceForm(request.GET)
    if form.is_valid():
        diagram_id = form.cleaned_data['diagram_id']
        trace_id = form.cleaned_data['trace_id']
        client_id = form.cleaned_data['client_id']
        data = list(FSMTrace.objects.filter(trace_session_id=trace_id,
                                            client_id=client_id).order_by('order').values())
        response = HttpResponse(yaml.safe_dump(data, default_flow_style=False),
                                content_type="application/force-download")
        response['Content-Disposition'] = 'attachment; filename="trace_{0}_{1}_{2}.yml"'.format(diagram_id,
                                                                                                client_id,
                                                                                                trace_id)
        return response
    else:
        return HttpResponse(form.errors)


class UploadTraceFileForm(forms.Form):
    file = forms.FileField()
    diagram_id = forms.IntegerField()


def upload_trace(request):
    if request.method == 'POST':
        form = UploadTraceFileForm(request.POST, request.FILES)
        if form.is_valid():
            data = yaml.load(request.FILES['file'].read())
            diagram_id = form.cleaned_data['diagram_id']
            replay = FSMTraceReplay(replay_data=json.dumps(data))
            replay.save()
            return HttpResponseRedirect('/static/prototype/index.html#!?diagram_id={0}&replay_id={1}'.format(diagram_id,
                                                                                                             replay.pk))
        else:
            return HttpResponse(form.errors)
    else:
        form2 = DiagramForm(request.GET)
        if form2.is_valid():
            diagram_id = form2.cleaned_data['diagram_id']
            form = UploadTraceFileForm(initial=dict(diagram_id=diagram_id))
            form.fields['diagram_id'].widget = forms.HiddenInput()
            return render(request, 'prototype/upload_trace.html', {'form': form, 'diagram_id': diagram_id})
        else:
            return HttpResponse(form.errors)


class ReplayForm(forms.Form):
    replay_id = forms.IntegerField()


def download_replay(request):
    form = ReplayForm(request.GET)
    if form.is_valid():
        replay_id = form.cleaned_data['replay_id']
        return JsonResponse(json.loads(FSMTraceReplay.objects.get(pk=replay_id).replay_data), safe=False)
    else:
        return HttpResponse(form.errors)
