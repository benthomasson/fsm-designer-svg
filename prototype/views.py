from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.http import JsonResponse
import yaml
import json
from prototype.models import Diagram, State, Transition, FSMTrace, FSMTraceReplay
from prototype.models import FiniteStateMachine, Channel, FiniteStateMachineState
from django.db import transaction


from functools import partial


from django import forms


class DiagramForm(forms.Form):
    diagram_id = forms.IntegerField()


class DiagramFSMForm(forms.Form):
    diagram_id = forms.IntegerField()
    finite_state_machine_id = forms.IntegerField(required=False)


class DiagramFSMForm2(forms.Form):
    diagram_id = forms.IntegerField(required=False)
    finite_state_machine_id = forms.IntegerField(required=False)


class UploadFileForm(forms.Form):
    file = forms.FileField()
    diagram_id = forms.IntegerField(required=False)


class UploadFSMFileForm(forms.Form):
    file = forms.FileField()
    diagram_id = forms.IntegerField(required=False)
    finite_state_machine_id = forms.IntegerField(required=False)

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
        if finite_state_machine_id:
            data['name'] = FiniteStateMachine.objects.filter(diagram_id=diagram_id, id=finite_state_machine_id).values_list('name', flat=True)[0]
        else:
            data['name'] = diagram.name
        data['diagram_id'] = diagram.pk
        if finite_state_machine_id > 0:
            states = (State.objects
                           .filter(diagram_id=diagram_id,
                                   finitestatemachinestate__finite_state_machine__id=finite_state_machine_id))
            data['finite_state_machine_id'] = finite_state_machine_id
            data['name'] = (FiniteStateMachine.objects
                                              .filter(diagram_id=diagram_id,
                                                      id=finite_state_machine_id)
                                              .values_list('name', flat=True)[0])
        else:
            states = State.objects.filter(diagram_id=diagram_id)
        data['states'] = map(transform_state, list(states.filter(diagram_id=diagram_id)
                                                         .values('x',
                                                                 'y',
                                                                 'name',
                                                                 'id')
                                                         .order_by('name')))
        state_pks = states.values_list('state_id', flat=True)
        data['transitions'] = map(transform_transition, list(Transition.objects
                                                                       .filter(from_state_id__in=state_pks)
                                                                       .filter(to_state_id__in=state_pks)
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
                                                      'id')
                                              .order_by('name'))
        data['channels'] = map(transform_channel, list(Channel.objects
                                                              .filter(from_fsm__diagram_id=diagram_id)
                                                              .values('from_fsm__name',
                                                                      'to_fsm__name',
                                                                      'from_fsm__id',
                                                                      'to_fsm__id',
                                                                      'inbox',
                                                                      'outbox',
                                                                      'label')
                                                              .order_by('from_fsm__name', 'to_fsm__name', 'label')))
        response = HttpResponse(yaml.safe_dump(data, default_flow_style=False),
                                content_type="application/force-download")
        response['Content-Disposition'] = 'attachment; filename="{0}.yml"'.format(diagram.name)
        return response
    else:
        return HttpResponse(form.errors)


def upload_diagram(data, diagram_id=None, finite_state_machine_id=None):
    if diagram_id is None:
        with transaction.atomic():
            diagram = Diagram()
            diagram.name = data.get('name', data.get("app", "diagram"))
            diagram.save()
    else:
        diagram = Diagram.objects.get(diagram_id=diagram_id)
        print Diagram.objects.filter(diagram_id=diagram_id).values()
    if finite_state_machine_id is None and len(data.get('fsms', [])) == 0:
        finite_state_machine_id = data.get('finite_state_machine_id', None)
    else:
        finite_state_machine_id = None
    states = []
    state_ids = []
    transitions = []
    fsms = []
    channels = []
    if finite_state_machine_id:
        State.objects.filter(diagram_id=diagram.pk,
                             finitestatemachinestate__finite_state_machine__id=finite_state_machine_id).delete()
    offsetX = 0
    offsetY = 0
    existing_fsm = None
    if finite_state_machine_id is not None:
        existing_fsm = list(FiniteStateMachine.objects.filter(diagram_id=diagram.pk,
                                                              id=finite_state_machine_id))
        if len(existing_fsm) == 1:
            existing_fsm = existing_fsm[0]
            offsetX = existing_fsm.x1
            offsetY = existing_fsm.y1
        else:
            existing_fsm = None
    minX, minY, maxX, maxY = None, None, None, None
    for i, state in enumerate(data.get('states', [])):
        new_state = State(diagram_id=diagram.pk,
                          name=state.get('label'),
                          id=i + diagram.state_id_seq,
                          x=state.get('x', 0),
                          y=state.get('y', 0))
        if minX is None or minX < new_state.x:
            minX = new_state.x + 100
        if minY is None or minY < new_state.y:
            minY = new_state.y + 100
        if maxX is None or maxX > new_state.x:
            maxX = new_state.x - 100
        if maxY is None or maxY > new_state.y:
            maxY = new_state.y - 100
        print new_state.id
        state_ids.append(new_state.id)
        states.append(new_state)
    if existing_fsm is not None:
        for state in states:
            state.x -= minX
            state.y -= minY
            state.x += offsetX
            state.y += offsetY
        maxX -= minX
        maxY -= minY
        minX = 0
        minY = 0
    with transaction.atomic():
        State.objects.bulk_create(states)
    with transaction.atomic():
        state_id_seq = diagram.state_id_seq + len(states)
        print state_id_seq
        (Diagram.objects
                .filter(pk=diagram.pk, state_id_seq__lt=state_id_seq)
                .update(state_id_seq=state_id_seq))
    print Diagram.objects.filter(pk=diagram.pk).values('state_id_seq')

    fsm = None
    if existing_fsm:
        with transaction.atomic():
            (FiniteStateMachine.objects
                               .filter(pk=existing_fsm.pk)
                               .update(x2=existing_fsm.x1 + maxX,
                                       y2=existing_fsm.y1 + maxY))
        fsm = existing_fsm
    elif finite_state_machine_id:
        with transaction.atomic():
            fsm = FiniteStateMachine(diagram_id=diagram.pk,
                                     name=data.get('name', 'fsm'),
                                     x1=minX,
                                     y1=minY,
                                     x2=maxX,
                                     y2=maxY,
                                     id=finite_state_machine_id)
            fsm.save()

    if fsm is not None:
        state_pks = State.objects.filter(diagram_id=diagram.pk,
                                         id__in=state_ids).values_list('state_id', flat=True)
        fsmstates = []
        for state_pk in state_pks:
            fsmstates.append(FiniteStateMachineState(finite_state_machine_id=fsm.pk,
                                                     state_id=state_pk))

        with transaction.atomic():
            FiniteStateMachineState.objects.bulk_create(fsmstates)

    print fsm
    if fsm is not None:
        states_map = dict(State.objects
                               .filter(diagram_id=diagram.pk, finitestatemachinestate__finite_state_machine__id=fsm.id)
                               .values_list("name", "pk"))
    else:
        states_map = dict(State.objects
                               .filter(diagram_id=diagram.pk)
                               .values_list("name", "pk"))
    print states
    print states_map
    for i, transition in enumerate(data.get('transitions', [])):
        new_transition = Transition(label=transition['label'],
                                    id=i + diagram.transition_id_seq,
                                    from_state_id=states_map[transition['from_state']],
                                    to_state_id=states_map[transition['to_state']])
        transitions.append(new_transition)

    with transaction.atomic():
        Transition.objects.bulk_create(transitions)
    transition_id_seq = diagram.transition_id_seq + len(transitions)
    with transaction.atomic():
        (Diagram.objects
                .filter(pk=diagram.pk, transition_id_seq__lt=transition_id_seq)
                .update(transition_id_seq=transition_id_seq))

    maxFsmId = 1
    for fsm in data.get('fsms', []):
        if fsm['id'] > maxFsmId:
            maxFsmId = fsm['id']
        new_fsm = FiniteStateMachine(diagram_id=diagram.pk,
                                     name=fsm.get('name', ''),
                                     id=fsm['id'],
                                     x1=fsm.get('x1', 0),
                                     x2=fsm.get('x2', 0),
                                     y1=fsm.get('y1', 0),
                                     y2=fsm.get('y2', 0))

        fsms.append(new_fsm)
    with transaction.atomic():
        FiniteStateMachine.objects.bulk_create(fsms)
    with transaction.atomic():
        Diagram.objects.filter(pk=diagram.pk, fsm_id_seq=maxFsmId).update(fsm_id_seq=maxFsmId)
    fsms_map = dict(FiniteStateMachine.objects
                                      .filter(diagram_id=diagram.pk)
                                      .values_list("name", "pk"))
    for i, channel in enumerate(data.get('channels', [])):
        new_channel = Channel(label=channel.get('label', ''),
                              id=i + diagram.channel_id_seq,
                              from_fsm_id=fsms_map[channel['from_fsm']],
                              to_fsm_id=fsms_map[channel['to_fsm']],
                              inbox=channel.get('inbox', ''),
                              outbox=channel.get('outbox', ''))
        channels.append(new_channel)

    with transaction.atomic():
        Channel.objects.bulk_create(channels)
    channel_id_seq = diagram.channel_id_seq + len(channels)
    with transaction.atomic():
        Diagram.objects.filter(pk=diagram.pk, channel_id_seq__lt=channel_id_seq).update(channel_id_seq=channel_id_seq)
    print Diagram.objects.filter(diagram_id=diagram_id).values()
    return diagram.pk


def upload(request):
    if request.method == 'POST':
        print request.POST
        print request.FILES
        form = UploadFSMFileForm(request.POST, request.FILES)
        if form.is_valid():
            data = yaml.load(request.FILES['file'].read())
            diagram_id = form.cleaned_data['diagram_id']
            finite_state_machine_id = form.cleaned_data['finite_state_machine_id']
            diagram_id = upload_diagram(data, diagram_id=diagram_id, finite_state_machine_id=finite_state_machine_id)
            return HttpResponseRedirect('/static/prototype/index.html#!?diagram_id={0}'.format(diagram_id))
    else:
        form = DiagramFSMForm2(request.GET)
        if form.is_valid():
            diagram_id = form.cleaned_data['diagram_id']
            finite_state_machine_id = form.cleaned_data['finite_state_machine_id']
        form = UploadFSMFileForm(initial=dict(diagram_id=diagram_id,
                                              finite_state_machine_id=finite_state_machine_id))
    return render(request, 'prototype/upload.html', {'form': form})


def upload_pipeline(request):
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
