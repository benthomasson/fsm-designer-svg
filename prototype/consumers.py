# In consumers.py
from channels import Group, Channel
from channels.sessions import channel_session
from prototype.models import Diagram, State, Transition, Client, History, MessageType
from prototype.models import FSMTrace
import urlparse
from django.db.models import Q
from . views import transform_state, transform_dict
from django.core.exceptions import ObjectDoesNotExist

import json
# Connected to websocket.connect
from functools import partial


transition_map = dict(from_state__id="from_state",
                      to_state__id="to_state",
                      label="label",
                      id='id')


state_map_in = dict(x='x',
                    y='y',
                    label='name',
                    id='id')


transform_transition = partial(transform_dict, transition_map)
transform_state_in = partial(transform_dict, state_map_in)


@channel_session
def ws_connect(message):
    # Accept connection
    message.reply_channel.send({"accept": True})
    data = urlparse.parse_qs(message.content['query_string'])
    diagram_id = data.get('diagram_id', ['null'])
    try:
        diagram_id = int(diagram_id[0])
    except ValueError:
        diagram_id = None
    if not diagram_id:
        diagram_id = None
    diagram, created = Diagram.objects.get_or_create(
        diagram_id=diagram_id, defaults=dict(name="diagram"))
    diagram_id = diagram.diagram_id
    message.channel_session['diagram_id'] = diagram_id
    Group("diagram-%s" % diagram_id).add(message.reply_channel)
    client = Client()
    client.save()
    message.channel_session['client_id'] = client.pk
    message.reply_channel.send({"text": json.dumps(["id", client.pk])})
    message.reply_channel.send({"text": json.dumps(["diagram_id", diagram_id])})
    diagram_data = diagram.__dict__.copy()
    if '_state' in diagram_data:
        del diagram_data['_state']
    message.reply_channel.send({"text": json.dumps(["Diagram", diagram_data])})
    states = list(State.objects
                  .filter(diagram_id=diagram_id).values())
    states = map(transform_state, states)
    transitions = list(Transition.objects
                                 .filter(Q(from_state__diagram_id=diagram_id) |
                                         Q(to_state__diagram_id=diagram_id))
                                 .values('from_state__id', 'to_state__id', 'label', 'id'))
    transitions = map(transform_transition, transitions)
    snapshot = dict(sender=0,
                    states=states,
                    transitions=transitions)
    message.reply_channel.send({"text": json.dumps(["Snapshot", snapshot])})
    history_message_ignore_types = ['StateSelected',
                                    'StateUnSelected',
                                    'TransitionSelected',
                                    'TransitionUnSelected',
                                    'Undo',
                                    'Redo']
    history = list(History.objects
                          .filter(diagram_id=diagram_id)
                          .exclude(message_type__name__in=history_message_ignore_types)
                          .exclude(undone=True)
                          .order_by('pk')
                          .values_list('message_data', flat=True)[:1000])
    message.reply_channel.send({"text": json.dumps(["History", history])})


@channel_session
def ws_message(message):
    # Send to debug printer
    Channel('console_printer').send({"text": message['text']})
    # Send to all clients editing the diagram
    Group("diagram-%s" % message.channel_session['diagram_id']).send({
        "text": message['text'],
    })
    # Send to persistence worker
    Channel('persistence').send(
        {"text": message['text'],
         "diagram": message.channel_session['diagram_id'],
         "client": message.channel_session['client_id']})


@channel_session
def ws_disconnect(message):
    Group("diagram-%s" % message.channel_session['diagram_id']).discard(message.reply_channel)


def console_printer(message):
    print message['text']


class _Persistence(object):

    def handle(self, message):
        diagram_id = message.get('diagram')
        if diagram_id is None:
            print "No diagram_id"
            return
        client_id = message.get('client')
        if client_id is None:
            print "No client_id"
            return
        data = json.loads(message['text'])
        if client_id != data[1].get('sender'):
            print "client_id mismatch expected:", client_id, "actual:", data[1].get('sender')
            return
        message_type = data[0]
        message_value = data[1]
        try:
            message_type_id = MessageType.objects.get(name=message_type).pk
        except ObjectDoesNotExist, e:
            print ("Missing message type", message_type)
            print "Unsupported message ", message_type
            return
        History(diagram_id=diagram_id,
                client_id=client_id,
                message_type_id=message_type_id,
                message_id=data[1].get('message_id', 0),
                message_data=message['text']).save()
        handler = getattr(self, "on{0}".format(message_type), None)
        if handler is not None:
            handler(message_value, diagram_id, client_id)
        else:
            print "Unsupported message ", message_type

    def onSnapshot(self, snapshot, diagram_id, client_id):
        state_map = dict()
        for state in snapshot['states']:
            state = transform_state_in(state)
            d, _ = State.objects.get_or_create(diagram_id=diagram_id,
                                               id=state['id'],
                                               defaults=state)
            d.name = state['name']
            d.x = state['x']
            d.y = state['y']
            d.save()
            state_map[state['id']] = d

        for transition in snapshot['transitions']:
            Transition.objects.get_or_create(from_state=state_map[transition['from_state']],
                                             to_state=state_map[transition['to_state']])

    def onStateCreate(self, state, diagram_id, client_id):
        state = transform_state_in(state)
        d, _ = State.objects.get_or_create(diagram_id=diagram_id,
                                           id=state['id'],
                                           defaults=state)
        d.x = state['x']
        d.y = state['y']
        d.save()
        (Diagram.objects
                           .filter(diagram_id=diagram_id)
                           .update(state_id_seq=state['id']))

    def onStateDestroy(self, state, diagram_id, client_id):
        State.objects.filter(diagram_id=diagram_id, id=state['id']).delete()

    def onStateMove(self, state, diagram_id, client_id):
        State.objects.filter(diagram_id=diagram_id,
                             id=state['id']).update(x=state['x'], y=state['y'])

    def onStateLabelEdit(self, state, diagram_id, client_id):
        State.objects.filter(diagram_id=diagram_id,
                             id=state['id']).update(name=state['label'])

    def onTransitionCreate(self, transition, diagram_id, client_id):
        if 'sender' in transition:
            del transition['sender']
        if 'message_id' in transition:
            del transition['message_id']
        state_map = dict(State.objects
                         .filter(diagram_id=diagram_id,
                                 id__in=[transition['from_id'], transition['to_id']])
                         .values_list('id', 'pk'))
        Transition.objects.get_or_create(id=transition['id'],
                                         from_state_id=state_map[transition['from_id']],
                                         to_state_id=state_map[transition['to_id']])
        (Diagram.objects
                           .filter(diagram_id=diagram_id)
                           .update(transition_id_seq=transition['id']))

    def onTransitionLabelEdit(self, transition, diagram_id, client_id):
        print transition
        Transition.objects.filter(from_state__diagram_id=diagram_id,
                                  id=transition['id']).update(label=transition['label'])

    def onTransitionDestroy(self, transition, diagram_id, client_id):
        state_map = dict(State.objects
                         .filter(diagram_id=diagram_id,
                                 id__in=[transition['from_id'], transition['to_id']])
                         .values_list('id', 'pk'))
        Transition.objects.filter(id=transition['id'],
                                  from_state_id=state_map[transition['from_id']],
                                  to_state_id=state_map[transition['to_id']]).delete()

    def onStateSelected(self, message_value, diagram_id, client_id):
        'Ignore StateSelected messages'
        pass

    def onStateUnSelected(self, message_value, diagram_id, client_id):
        'Ignore StateSelected messages'
        pass

    def onTransitionSelected(self, message_value, diagram_id, client_id):
        'Ignore TransitionSelected messages'
        pass

    def onTransitionUnSelected(self, message_value, diagram_id, client_id):
        'Ignore TransitionSelected messages'
        pass

    def onUndo(self, message_value, diagram_id, client_id):
        undo_persistence.handle(message_value['original_message'], diagram_id, client_id)

    def onRedo(self, message_value, diagram_id, client_id):
        redo_persistence.handle(message_value['original_message'], diagram_id, client_id)

    def onFSMTrace(self, message_value, diagram_id, client_id):
        FSMTrace(trace_session_id=message_value['trace_id'],
                 fsm_name=message_value['fsm_name'],
                 from_state=message_value['from_state'],
                 to_state=message_value['to_state'],
                 order=message_value['order'],
                 client_id=client_id,
                 message_type=message_value['recv_message_type']).save()

persistence = _Persistence()


class _UndoPersistence(object):

    def handle(self, message, diagram_id, client_id):
        message_type = message[0]
        message_value = message[1]
        History.objects.filter(diagram_id=diagram_id,
                               client_id=message_value['sender'],
                               message_id=message_value['message_id']).update(undone=True)
        handler = getattr(self, "on{0}".format(message_type), None)
        if handler is not None:
            handler(message_value, diagram_id, client_id)
        else:
            print "Unsupported undo message ", message_type

    def onSnapshot(self, snapshot, diagram_id, client_id):
        pass

    def onStateCreate(self, state, diagram_id, client_id):
        persistence.onStateDestroy(state, diagram_id, client_id)

    def onStateDestroy(self, state, diagram_id, client_id):
        inverted = state.copy()
        inverted['label'] = state['previous_label']
        inverted['x'] = state['previous_x']
        inverted['y'] = state['previous_y']
        persistence.onStateCreate(inverted, diagram_id, client_id)

    def onStateMove(self, state, diagram_id, client_id):
        inverted = state.copy()
        inverted['x'] = state['previous_x']
        inverted['y'] = state['previous_y']
        persistence.onStateMove(inverted, diagram_id, client_id)

    def onStateLabelEdit(self, state, diagram_id, client_id):
        inverted = state.copy()
        inverted['label'] = state['previous_label']
        persistence.onStateLabelEdit(inverted, diagram_id, client_id)

    def onTransitionCreate(self, transition, diagram_id, client_id):
        persistence.onTransitionDestroy(transition, diagram_id, client_id)

    def onTransitionDestroy(self, transition, diagram_id, client_id):
        persistence.onTransitionCreate(transition, diagram_id, client_id)

    def onStateSelected(self, message_value, diagram_id, client_id):
        'Ignore StateSelected messages'
        pass

    def onStateUnSelected(self, message_value, diagram_id, client_id):
        'Ignore StateSelected messages'
        pass

    def onUndo(self, message_value, diagram_id, client_id):
        pass


undo_persistence = _UndoPersistence()


class _RedoPersistence(object):

    def handle(self, message, diagram_id, client_id):
        message_type = message[0]
        message_value = message[1]
        History.objects.filter(diagram_id=diagram_id,
                               client_id=message_value['sender'],
                               message_id=message_value['message_id']).update(undone=False)
        handler_name = "on{0}".format(message_type)
        handler = getattr(self, handler_name, getattr(persistence, handler_name, None))
        if handler is not None:
            handler(message_value, diagram_id, client_id)
        else:
            print "Unsupported redo message ", message_type

    def onStateSelected(self, message_value, diagram_id, client_id):
        'Ignore StateSelected messages'
        pass

    def onStateUnSelected(self, message_value, diagram_id, client_id):
        'Ignore StateSelected messages'
        pass

    def onUndo(self, message_value, diagram_id, client_id):
        'Ignore Undo messages'
        pass

    def onRedo(self, message_value, diagram_id, client_id):
        'Ignore Redo messages'
        pass


redo_persistence = _RedoPersistence()
