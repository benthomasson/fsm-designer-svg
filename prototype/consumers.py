# In consumers.py
from channels import Group, Channel
from channels.sessions import channel_session
from prototype.models import FiniteStateMachine, State, Transition, Client, History, MessageType
import urlparse
from django.db.models import Q

import json
# Connected to websocket.connect


@channel_session
def ws_connect(message):
    # Accept connection
    message.reply_channel.send({"accept": True})
    data = urlparse.parse_qs(message.content['query_string'])
    finite_state_machine_id = data.get('finite_state_machine_id', ['null'])
    try:
        finite_state_machine_id = int(finite_state_machine_id[0])
    except ValueError:
        finite_state_machine_id = None
    if not finite_state_machine_id:
        finite_state_machine_id = None
    fsm, created = FiniteStateMachine.objects.get_or_create(
        finite_state_machine_id=finite_state_machine_id, defaults=dict(name="fsm"))
    finite_state_machine_id = fsm.finite_state_machine_id
    message.channel_session['finite_state_machine_id'] = finite_state_machine_id
    Group("fsm-%s" % finite_state_machine_id).add(message.reply_channel)
    client = Client()
    client.save()
    message.channel_session['client_id'] = client.pk
    message.reply_channel.send({"text": json.dumps(["id", client.pk])})
    message.reply_channel.send({"text": json.dumps(["finite_state_machine_id", finite_state_machine_id])})
    fsm_data = fsm.__dict__.copy()
    if '_state' in fsm_data:
        del fsm_data['_state']
    message.reply_channel.send({"text": json.dumps(["FiniteStateMachine", fsm_data])})
    states = list(State.objects
                  .filter(finite_state_machine_id=finite_state_machine_id).values())
    transitions = [dict(from_state=x['from_state__id'],
                        to_state=x['to_state__id'])
                   for x in list(Transition.objects
                                 .filter(Q(from_state__finite_state_machine_id=finite_state_machine_id) |
                                         Q(to_state__finite_state_machine_id=finite_state_machine_id))
                                 .values('from_state__id', 'to_state__id'))]
    snapshot = dict(sender=0,
                    states=states,
                    transitions=transitions)
    message.reply_channel.send({"text": json.dumps(["Snapshot", snapshot])})
    history_message_ignore_types = ['StateSelected', 'StateUnSelected', 'Undo', 'Redo']
    history = list(History.objects
                          .filter(finite_state_machine_id=finite_state_machine_id)
                          .exclude(message_type__name__in=history_message_ignore_types)
                          .exclude(undone=True)
                          .order_by('pk')
                          .values_list('message_data', flat=True)[:1000])
    message.reply_channel.send({"text": json.dumps(["History", history])})


@channel_session
def ws_message(message):
    # Send to debug printer
    Channel('console_printer').send({"text": message['text']})
    # Send to all clients editing the fsm
    Group("fsm-%s" % message.channel_session['finite_state_machine_id']).send({
        "text": message['text'],
    })
    # Send to persistence worker
    Channel('persistence').send(
        {"text": message['text'],
         "fsm": message.channel_session['finite_state_machine_id'],
         "client": message.channel_session['client_id']})


@channel_session
def ws_disconnect(message):
    Group("fsm-%s" % message.channel_session['finite_state_machine_id']).discard(message.reply_channel)


def console_printer(message):
    print message['text']


class _Persistence(object):

    def handle(self, message):
        finite_state_machine_id = message.get('fsm')
        if finite_state_machine_id is None:
            print "No finite_state_machine_id"
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
        message_type_id = MessageType.objects.get_or_create(name=message_type)[0].pk
        History(finite_state_machine_id=finite_state_machine_id,
                client_id=client_id,
                message_type_id=message_type_id,
                message_id=data[1].get('message_id', 0),
                message_data=message['text']).save()
        handler = getattr(self, "on{0}".format(message_type), None)
        if handler is not None:
            handler(message_value, finite_state_machine_id, client_id)
        else:
            print "Unsupported message ", message_type

    def onSnapshot(self, snapshot, finite_state_machine_id, client_id):
        state_map = dict()
        for state in snapshot['states']:
            if 'size' in state:
                del state['size']
            if 'height' in state:
                del state['height']
            if 'width' in state:
                del state['width']
            d, _ = State.objects.get_or_create(finite_state_machine_id=finite_state_machine_id,
                                               id=state['id'],
                                               defaults=state)
            d.name = state['name']
            d.x = state['x']
            d.y = state['y']
            d.type = state['type']
            d.save()
            state_map[state['id']] = d

        for transition in snapshot['transitions']:
            Transition.objects.get_or_create(from_state=state_map[transition['from_state']],
                                             to_state=state_map[transition['to_state']])

    def onStateCreate(self, state, finite_state_machine_id, client_id):
        if 'sender' in state:
            del state['sender']
        if 'message_id' in state:
            del state['message_id']
        d, _ = State.objects.get_or_create(finite_state_machine_id=finite_state_machine_id,
                                           id=state['id'],
                                           defaults=state)
        d.x = state['x']
        d.y = state['y']
        d.type = state['type']
        d.save()

    def onStateDestroy(self, state, finite_state_machine_id, client_id):
        State.objects.filter(finite_state_machine_id=finite_state_machine_id, id=state['id']).delete()

    def onStateMove(self, state, finite_state_machine_id, client_id):
        State.objects.filter(finite_state_machine_id=finite_state_machine_id,
                             id=state['id']).update(x=state['x'], y=state['y'])

    def onStateLabelEdit(self, state, finite_state_machine_id, client_id):
        State.objects.filter(finite_state_machine_id=finite_state_machine_id,
                             id=state['id']).update(name=state['name'])

    def onTransitionCreate(self, transition, finite_state_machine_id, client_id):
        if 'sender' in transition:
            del transition['sender']
        if 'message_id' in transition:
            del transition['message_id']
        state_map = dict(State.objects
                         .filter(finite_state_machine_id=finite_state_machine_id,
                                 id__in=[transition['from_id'], transition['to_id']])
                         .values_list('id', 'pk'))
        Transition.objects.get_or_create(from_state_id=state_map[transition['from_id']],
                                         to_state_id=state_map[transition['to_id']])

    def onTransitionDestroy(self, transition, finite_state_machine_id, client_id):
        state_map = dict(State.objects
                         .filter(finite_state_machine_id=finite_state_machine_id,
                                 id__in=[transition['from_id'], transition['to_id']])
                         .values_list('id', 'pk'))
        Transition.objects.filter(from_state_id=state_map[transition['from_id']],
                                  to_state_id=state_map[transition['to_id']]).delete()

    def onStateSelected(self, message_value, finite_state_machine_id, client_id):
        'Ignore StateSelected messages'
        pass

    def onStateUnSelected(self, message_value, finite_state_machine_id, client_id):
        'Ignore StateSelected messages'
        pass

    def onUndo(self, message_value, finite_state_machine_id, client_id):
        undo_persistence.handle(message_value['original_message'], finite_state_machine_id, client_id)

    def onRedo(self, message_value, finite_state_machine_id, client_id):
        redo_persistence.handle(message_value['original_message'], finite_state_machine_id, client_id)


persistence = _Persistence()


class _UndoPersistence(object):

    def handle(self, message, finite_state_machine_id, client_id):
        message_type = message[0]
        message_value = message[1]
        History.objects.filter(finite_state_machine_id=finite_state_machine_id,
                               client_id=message_value['sender'],
                               message_id=message_value['message_id']).update(undone=True)
        handler = getattr(self, "on{0}".format(message_type), None)
        if handler is not None:
            handler(message_value, finite_state_machine_id, client_id)
        else:
            print "Unsupported undo message ", message_type

    def onSnapshot(self, snapshot, finite_state_machine_id, client_id):
        pass

    def onStateCreate(self, state, finite_state_machine_id, client_id):
        persistence.onStateDestroy(state, finite_state_machine_id, client_id)

    def onStateDestroy(self, state, finite_state_machine_id, client_id):
        inverted = state.copy()
        inverted['type'] = state['previous_type']
        inverted['name'] = state['previous_name']
        inverted['x'] = state['previous_x']
        inverted['y'] = state['previous_y']
        persistence.onStateCreate(inverted, finite_state_machine_id, client_id)

    def onStateMove(self, state, finite_state_machine_id, client_id):
        inverted = state.copy()
        inverted['x'] = state['previous_x']
        inverted['y'] = state['previous_y']
        persistence.onStateMove(inverted, finite_state_machine_id, client_id)

    def onStateLabelEdit(self, state, finite_state_machine_id, client_id):
        inverted = state.copy()
        inverted['name'] = state['previous_name']
        persistence.onStateLabelEdit(inverted, finite_state_machine_id, client_id)

    def onTransitionCreate(self, transition, finite_state_machine_id, client_id):
        persistence.onTransitionDestroy(transition, finite_state_machine_id, client_id)

    def onTransitionDestroy(self, transition, finite_state_machine_id, client_id):
        persistence.onTransitionCreate(transition, finite_state_machine_id, client_id)

    def onStateSelected(self, message_value, finite_state_machine_id, client_id):
        'Ignore StateSelected messages'
        pass

    def onStateUnSelected(self, message_value, finite_state_machine_id, client_id):
        'Ignore StateSelected messages'
        pass

    def onUndo(self, message_value, finite_state_machine_id, client_id):
        pass


undo_persistence = _UndoPersistence()


class _RedoPersistence(object):

    def handle(self, message, finite_state_machine_id, client_id):
        message_type = message[0]
        message_value = message[1]
        History.objects.filter(finite_state_machine_id=finite_state_machine_id,
                               client_id=message_value['sender'],
                               message_id=message_value['message_id']).update(undone=False)
        handler_name = "on{0}".format(message_type)
        handler = getattr(self, handler_name, getattr(persistence, handler_name, None))
        if handler is not None:
            handler(message_value, finite_state_machine_id, client_id)
        else:
            print "Unsupported redo message ", message_type

    def onStateSelected(self, message_value, finite_state_machine_id, client_id):
        'Ignore StateSelected messages'
        pass

    def onStateUnSelected(self, message_value, finite_state_machine_id, client_id):
        'Ignore StateSelected messages'
        pass

    def onUndo(self, message_value, finite_state_machine_id, client_id):
        'Ignore Undo messages'
        pass

    def onRedo(self, message_value, finite_state_machine_id, client_id):
        'Ignore Redo messages'
        pass


redo_persistence = _RedoPersistence()
