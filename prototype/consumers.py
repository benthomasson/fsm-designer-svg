from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from django.db.models import Q
import uuid
import json
import urllib.parse
import logging
import traceback
from pprint import pformat, pprint

from .models import Diagram, State, Transition, Client, History, MessageType
from .models import FiniteStateMachine, FiniteStateMachineState
from .models import Channel as FSMChannel
from .models import FSMTrace

from . views import transform_state, transform_dict
# from django.core.exceptions import ObjectDoesNotExist

# Connected to websocket.connect
from functools import partial

logger = logging.getLogger("prototype.consumers")
HISTORY_MESSAGE_IGNORE_TYPES = ['StateSelected',
                                'StateUnSelected',
                                'TransitionSelected',
                                'TransitionUnSelected',
                                'Undo',
                                'Redo']

transition_map = dict(from_state__id="from_state",
                      to_state__id="to_state",
                      label="label",
                      id='id')


state_map_in = dict(x='x',
                    y='y',
                    label='name',
                    id='id')

channel_map = dict(from_fsm__id="from_fsm",
                   to_fsm__id="to_fsm",
                   label="label",
                   outbox="outbox",
                   inbox="inbox",
                   id='id')


diagram_map = dict(uuid='diagram_id',
                   name='name',
                   fsm_id_seq='fsm_id_seq',
                   channel_id_seq='channel_id_seq',
                   state_id_seq='state_id_seq',
                   transition_id_seq='transition_id_seq')


transform_diagram = partial(transform_dict, diagram_map)
transform_transition = partial(transform_dict, transition_map)
transform_state_in = partial(transform_dict, state_map_in)
transform_channel = partial(transform_dict, channel_map)


class ConsumerException(Exception):
    pass


class FSMDesignerConsumer(AsyncWebsocketConsumer):

    async def send_json(self, message_data):
        print("sending", pformat(message_data))
        await self.send(text_data=json.dumps(message_data))

    async def connect(self, event=None):
        print("connected")
        await self.accept()
        print("accepted")
        self.message_types = await self.get_message_types()
        self.ignore_message_types = ['StateSelected',
                                     'StateUnSelected',
                                     'TransitionSelected',
                                     'TransitionUnSelected',
                                     'StartRecording',
                                     'StopRecording',
                                     'CoverageRequest',
                                     'Undo',
                                     'Redo']
        pprint(["message_types", self.message_types])
        self.client_id = 0
        await self.create_client()
        await self.send(text_data=json.dumps(['id', self.client.pk]))
        diagram_data = await self.get_or_create_diagram()
        await self.send(text_data=json.dumps(['Diagram', diagram_data]))
        snapshot = await self.send_snapshot()
        await self.send_json(["Snapshot", snapshot])
        history = await self.send_history()
        await self.send_json(["History", history])

    async def disconnect(self, close_code):
        pass

    @database_sync_to_async
    def get_message_types(self):
        return dict(MessageType.objects.all().values_list('name', 'pk'))

    @database_sync_to_async
    def create_client(self):
        self.client = Client()
        self.client.save()
        self.client_id = self.client.pk

    @database_sync_to_async
    def get_or_create_diagram(self):
        qs_data = urllib.parse.parse_qs(self.scope['query_string'])
        print("qs_data: " + str(urllib.parse.parse_qs(self.scope['query_string'])))
        diagram_uuid = qs_data.get(b'diagram_id', [b'xxxx'])[0].decode()
        print(diagram_uuid, Diagram.objects.filter(uuid=diagram_uuid).values())
        diagram, created = Diagram.objects.get_or_create(
            uuid=diagram_uuid, defaults=dict(name="diagram", uuid=str(uuid.uuid4())))
        print(diagram.uuid)
        self.diagram_id = diagram.diagram_id
        # print(self.diagram_id, created, diagram.uuid)
        diagram_data = diagram.__dict__.copy()
        if '_state' in diagram_data:
            diagram_data['diagram_id'] = diagram_data['uuid']
            del diagram_data['_state']
        return diagram_data

    @database_sync_to_async
    def send_snapshot(self):
        states = list(State.objects
                      .filter(diagram_id=self.diagram_id).values())
        states = list(map(transform_state, states))
        transitions = list(Transition.objects
                                     .filter(Q(from_state__diagram_id=self.diagram_id) |
                                             Q(to_state__diagram_id=self.diagram_id))
                                     .values('from_state__id', 'to_state__id', 'label', 'id'))
        transitions = list(map(transform_transition, transitions))
        fsms = list(FiniteStateMachine.objects
                    .filter(diagram_id=self.diagram_id).values())
        channels = list(FSMChannel.objects
                                  .filter(Q(from_fsm__diagram_id=self.diagram_id) |
                                          Q(to_fsm__diagram_id=self.diagram_id))
                                  .values('from_fsm__id', 'to_fsm__id', 'label', 'id', 'outbox', 'inbox'))
        channels = list(map(transform_channel, channels))
        snapshot = dict(sender=0,
                        states=states,
                        transitions=transitions,
                        fsms=fsms,
                        channels=channels)
        return snapshot

    @database_sync_to_async
    def send_history(self):
        return list(History.objects
                           .filter(diagram_id=self.diagram_id)
                           .exclude(message_type__name__in=HISTORY_MESSAGE_IGNORE_TYPES)
                           .exclude(undone=True)
                           .order_by('pk')
                           .values_list('message_data', flat=True)[:1000])

    async def receive(self, text_data):
        # print(["received: ", pformat(text_data)])
        # pprint(json.loads(text_data))
        data = json.loads(text_data)
        if isinstance(data[1], list):
            logger.error("no sender")
            return
        if isinstance(data[1], dict) and self.client_id != data[1].get('sender'):
            logger.error("client_id mismatch expected: %s actual %s", self.client_id, data[1].get('sender'))
            logger.error(pformat(data))
            return
        message_type = data[0]
        message_value = data[1]

        # pprint(message_type)
        # pprint(message_value)

        if message_type not in self.message_types:
            logger.warning("Unsupported message %s: no message type", message_type)
            return

        if message_type in self.ignore_message_types:
            return

        History(diagram_id=self.diagram_id,
                client_id=self.client_id,
                message_type_id=self.message_types[message_type],
                message_id=data[1].get('message_id', 0),
                message_data=text_data).save()

        handler = self.get_handler(message_type)

        if handler is not None:
            try:
                await handler(message_value, self.diagram_id, self.client_id)
                logger.info(message_type)
            except ConsumerException as e:
                # Group("client-%s" % client_id).send({"text": json.dumps(["Error", str(e)])})
                logger.error(traceback.format_exc())
            except Exception as e:
                # Group("client-%s" % client_id).send({"text": json.dumps(["Error", "Server Error"])})
                logger.error(traceback.format_exc())
            except BaseException as e:
                # Group("client-%s" % client_id).send({"text": json.dumps(["Error", "Server Error"])})
                logger.error(traceback.format_exc())
        else:
            logger.warning("Unsupported message %s: no handler", message_type)

    def get_handler(self, message_type):
        return getattr(self, "on{0}".format(message_type), None)

    async def onMultipleMessage(self, message_value, topology_id, client_id):
        for message in message_value['messages']:
            message_type = message['msg_type']
            if message_type not in self.message_types:
                logger.warning("Unsupported message %s: no message type", message_type)
                return

            if message_type in self.ignore_message_types:
                return
            handler = self.get_handler(message_type)
            if handler is not None:
                await handler(message, topology_id, client_id)
                logger.info(message_type)
            else:
                logger.warning("Unsupported message %s: no handler", message_type)

    @database_sync_to_async
    def onSnapshot(self, snapshot, diagram_id, client_id):
        pass

    @database_sync_to_async
    def onStateCreate(self, state, diagram_id, client_id):
        state = transform_state_in(state)
        d, _ = State.objects.get_or_create(diagram_id=diagram_id,
                                           id=state['id'],
                                           defaults=state)
        d.x = state['x']
        d.y = state['y']
        d.save()
        (Diagram.objects
                .filter(diagram_id=diagram_id, state_id_seq__lt=state['id'])
                .update(state_id_seq=state['id']))

    @database_sync_to_async
    def onStateDestroy(self, state, diagram_id, client_id):
        State.objects.filter(diagram_id=diagram_id, id=state['id']).delete()

    @database_sync_to_async
    def onStateMove(self, state, diagram_id, client_id):
        State.objects.filter(diagram_id=diagram_id,
                             id=state['id']).update(x=state['x'], y=state['y'])

    @database_sync_to_async
    def onStateLabelEdit(self, state, diagram_id, client_id):
        State.objects.filter(diagram_id=diagram_id,
                             id=state['id']).update(name=state['label'])

    @database_sync_to_async
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

    @database_sync_to_async
    def onTransitionLabelEdit(self, transition, diagram_id, client_id):
        Transition.objects.filter(from_state__diagram_id=diagram_id,
                                  id=transition['id']).update(label=transition['label'])

    @database_sync_to_async
    def onTransitionDestroy(self, transition, diagram_id, client_id):
        state_map = dict(State.objects
                         .filter(diagram_id=diagram_id,
                                 id__in=[transition['from_id'], transition['to_id']])
                         .values_list('id', 'pk'))
        Transition.objects.filter(id=transition['id'],
                                  from_state_id=state_map[transition['from_id']],
                                  to_state_id=state_map[transition['to_id']]).delete()

    @database_sync_to_async
    def onGroupCreate(self, group, diagram_id, client_id):
        if group['type'] == 'fsm':
            FiniteStateMachine(diagram_id=diagram_id,
                               id=group['id'],
                               x1=group['x1'],
                               x2=group['x2'],
                               y1=group['y1'],
                               y2=group['y2'],
                               name=group['name']).save()
            (Diagram.objects
                    .filter(diagram_id=diagram_id, fsm_id_seq__lt=group['id'])
                    .update(fsm_id_seq=group['id']))

    @database_sync_to_async
    def onGroupLabelEdit(self, group, diagram_id, client_id):
        FiniteStateMachine.objects.filter(diagram_id=diagram_id, id=group['id']).update(name=group['name'])

    @database_sync_to_async
    def onGroupDestroy(self, state, diagram_id, client_id):
        FiniteStateMachine.objects.filter(diagram_id=diagram_id, id=state['id']).delete()

    @database_sync_to_async
    def onGroupMove(self, group, diagram_id, client_id):
        FiniteStateMachine.objects.filter(diagram_id=diagram_id,
                                          id=group['id']).update(x1=group['x1'],
                                                                 x2=group['x2'],
                                                                 y1=group['y1'],
                                                                 y2=group['y2'])

    @database_sync_to_async
    def onGroupMembership(self, group_membership, diagram_id, client_id):
        members = set(group_membership['members'])
        fsm = FiniteStateMachine.objects.get(diagram_id=diagram_id, id=group_membership['id'])
        existing = set(FiniteStateMachineState.objects
                                              .filter(finite_state_machine=fsm)
                                              .values_list('state__id', flat=True))
        new = members - existing
        removed = existing - members

        (FiniteStateMachineState.objects
                                .filter(finite_state_machine__finite_state_machine_id=fsm.finite_state_machine_id,
                                        state__id__in=list(removed)).delete())

        state_map = dict(State.objects.filter(diagram_id=diagram_id, id__in=list(new)).values_list('id', 'state_id'))
        new_entries = []
        for i in new:
            new_entries.append(FiniteStateMachineState(finite_state_machine=fsm,
                                                       state_id=state_map[i]))
        if new_entries:
            FiniteStateMachineState.objects.bulk_create(new_entries)

    @database_sync_to_async
    def onChannelCreate(self, channel, diagram_id, client_id):
        if 'sender' in channel:
            del channel['sender']
        if 'message_id' in channel:
            del channel['message_id']
        fsm_map = dict(FiniteStateMachine.objects
                       .filter(diagram_id=diagram_id,
                               id__in=[channel['from_id'], channel['to_id']])
                       .values_list('id', 'pk'))
        FSMChannel.objects.get_or_create(id=channel['id'],
                                         from_fsm_id=fsm_map[channel['from_id']],
                                         to_fsm_id=fsm_map[channel['to_id']],
                                         defaults=dict(inbox="", outbox="", label=""))
        (Diagram.objects
                .filter(diagram_id=diagram_id, channel_id_seq__lt=channel['id'])
                .update(channel_id_seq=channel['id']))

    @database_sync_to_async
    def onChannelLabelEdit(self, channel, diagram_id, client_id):
        FSMChannel.objects.filter(from_fsm__diagram_id=diagram_id,
                                  id=channel['id']).update(label=channel['label'])

    @database_sync_to_async
    def onChannelDestroy(self, channel, diagram_id, client_id):
        fsm_map = dict(FiniteStateMachine.objects
                                         .filter(diagram_id=diagram_id,
                                                 id__in=[channel['from_id'], channel['to_id']])
                                         .values_list('id', 'pk'))
        FSMChannel.objects.filter(id=channel['id'],
                                  from_fsm_id=fsm_map[channel['from_id']],
                                  to_fsm_id=fsm_map[channel['to_id']]).delete()

    @database_sync_to_async
    def onFSMTrace(self, message_value, diagram_id, client_id):
        FSMTrace(trace_session_id=message_value['trace_id'],
                 fsm_name=message_value['fsm_name'],
                 from_state=message_value['from_state'],
                 to_state=message_value['to_state'],
                 order=message_value['order'],
                 client_id=client_id,
                 message_type=message_value['recv_message_type']).save()


"""


@channel_session
def ws_connect(message):
    # Accept connection
    message.reply_channel.send({"accept": True})
    data = urlparse.parse_qs(message.content['query_string'])
    diagram_uuid = data.get('diagram_id', ['xxxx'])[0]
    diagram, created = Diagram.objects.get_or_create(
        uuid=diagram_uuid, defaults=dict(name="diagram", uuid=str(uuid.uuid4())))
    diagram_id = diagram.diagram_id
    message.channel_session['diagram_id'] = diagram_id
    Group("diagram-%s" % diagram_id).add(message.reply_channel)
    client = Client()
    client.save()
    message.channel_session['client_id'] = client.pk
    message.reply_channel.send({"text": json.dumps(["id", client.pk])})
    message.reply_channel.send({"text": json.dumps(["diagram_uuid", diagram.uuid])})
    diagram_data = diagram.__dict__.copy()
    if '_state' in diagram_data:
        del diagram_data['_state']
    message.reply_channel.send({"text": json.dumps(["Diagram", transform_diagram(diagram_data)])})

    states = list(State.objects
                  .filter(diagram_id=diagram_id).values())
    states = map(transform_state, states)
    transitions = list(Transition.objects
                                 .filter(Q(from_state__diagram_id=diagram_id) |
                                         Q(to_state__diagram_id=diagram_id))
                                 .values('from_state__id', 'to_state__id', 'label', 'id'))
    transitions = map(transform_transition, transitions)
    fsms = list(FiniteStateMachine.objects
                .filter(diagram_id=diagram_id).values())
    channels = list(FSMChannel.objects
                              .filter(Q(from_fsm__diagram_id=diagram_id) |
                                      Q(to_fsm__diagram_id=diagram_id))
                              .values('from_fsm__id', 'to_fsm__id', 'label', 'id', 'outbox', 'inbox'))
    channels = map(transform_channel, channels)
    snapshot = dict(sender=0,
                    states=states,
                    transitions=transitions,
                    fsms=fsms,
                    channels=channels)

    message.reply_channel.send({"text": json.dumps(["Snapshot", snapshot])})
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
    print (message['text'])


class _Persistence(object):

    def get_handler(self, message_type):
        return getattr(self, "on{0}".format(message_type), None)

    def handle(self, message):
        diagram_id = message.get('diagram')
        if diagram_id is None:
            print ("No diagram_id")
            return
        client_id = message.get('client')
        if client_id is None:
            print ("No client_id")
            return
        data = json.loads(message['text'])
        if client_id != data[1].get('sender'):
            print ("client_id mismatch expected:", client_id, "actual:", data[1].get('sender'))
            return
        message_type = data[0]
        message_value = data[1]
        try:
            message_type_id = MessageType.objects.get(name=message_type).pk
        except ObjectDoesNotExist:
            print ("Missing message type", message_type)
            print ("Unsupported message ", message_type)
            return
        History(diagram_id=diagram_id,
                client_id=client_id,
                message_type_id=message_type_id,
                message_id=data[1].get('message_id', 0),
                message_data=message['text']).save()
        handler = self.get_handler(message_type)
        if handler is not None:
            handler(message_value, diagram_id, client_id)
        else:
            print ("Unsupported message ", message_type)

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
                .filter(diagram_id=diagram_id, state_id_seq__lt=state['id'])
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

    def onGroupCreate(self, group, diagram_id, client_id):
        if group['type'] == 'fsm':
            FiniteStateMachine(diagram_id=diagram_id,
                               id=group['id'],
                               x1=group['x1'],
                               x2=group['x2'],
                               y1=group['y1'],
                               y2=group['y2'],
                               name=group['name']).save()
            (Diagram.objects
                    .filter(diagram_id=diagram_id, fsm_id_seq__lt=group['id'])
                    .update(fsm_id_seq=group['id']))

    def onGroupLabelEdit(self, group, diagram_id, client_id):
        FiniteStateMachine.objects.filter(diagram_id=diagram_id, id=group['id']).update(name=group['name'])

    def onGroupDestroy(self, state, diagram_id, client_id):
        FiniteStateMachine.objects.filter(diagram_id=diagram_id, id=state['id']).delete()

    def onGroupMove(self, group, diagram_id, client_id):
        FiniteStateMachine.objects.filter(diagram_id=diagram_id,
                                          id=group['id']).update(x1=group['x1'],
                                                                 x2=group['x2'],
                                                                 y1=group['y1'],
                                                                 y2=group['y2'])

    def onGroupMembership(self, group_membership, diagram_id, client_id):
        members = set(group_membership['members'])
        fsm = FiniteStateMachine.objects.get(diagram_id=diagram_id, id=group_membership['id'])
        existing = set(FiniteStateMachineState.objects
                                              .filter(finite_state_machine=fsm)
                                              .values_list('state__id', flat=True))
        new = members - existing
        removed = existing - members

        (FiniteStateMachineState.objects
                                .filter(finite_state_machine__finite_state_machine_id=fsm.finite_state_machine_id,
                                        state__id__in=list(removed)).delete())

        state_map = dict(State.objects.filter(diagram_id=diagram_id, id__in=list(new)).values_list('id', 'state_id'))
        new_entries = []
        for i in new:
            new_entries.append(FiniteStateMachineState(finite_state_machine=fsm,
                                                       state_id=state_map[i]))
        if new_entries:
            FiniteStateMachineState.objects.bulk_create(new_entries)

    def onChannelCreate(self, channel, diagram_id, client_id):
        if 'sender' in channel:
            del channel['sender']
        if 'message_id' in channel:
            del channel['message_id']
        fsm_map = dict(FiniteStateMachine.objects
                       .filter(diagram_id=diagram_id,
                               id__in=[channel['from_id'], channel['to_id']])
                       .values_list('id', 'pk'))
        FSMChannel.objects.get_or_create(id=channel['id'],
                                         from_fsm_id=fsm_map[channel['from_id']],
                                         to_fsm_id=fsm_map[channel['to_id']],
                                         defaults=dict(inbox="", outbox="", label=""))
        (Diagram.objects
                .filter(diagram_id=diagram_id, channel_id_seq__lt=channel['id'])
                .update(channel_id_seq=channel['id']))

    def onChannelLabelEdit(self, channel, diagram_id, client_id):
        FSMChannel.objects.filter(from_fsm__diagram_id=diagram_id,
                                  id=channel['id']).update(label=channel['label'])

    def onChannelDestroy(self, channel, diagram_id, client_id):
        fsm_map = dict(FiniteStateMachine.objects
                                         .filter(diagram_id=diagram_id,
                                                 id__in=[channel['from_id'], channel['to_id']])
                                         .values_list('id', 'pk'))
        FSMChannel.objects.filter(id=channel['id'],
                                  from_fsm_id=fsm_map[channel['from_id']],
                                  to_fsm_id=fsm_map[channel['to_id']]).delete()

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

    def onChannelSelected(self, message_value, diagram_id, client_id):
        'Ignore ChannelSelected messages'
        pass

    def onChannelUnSelected(self, message_value, diagram_id, client_id):
        'Ignore ChannelSelected messages'
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

    def onMultipleMessage(self, message_value, diagram_id, client_id):
        for message in message_value['messages']:
            handler = self.get_handler(message['msg_type'])
            if handler is not None:
                handler(message, diagram_id, client_id)
            else:
                print ("Unsupported message %s" % message['msg_type'])


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
            print ("Unsupported undo message ", message_type)

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
            print ("Unsupported redo message ", message_type)

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

"""
