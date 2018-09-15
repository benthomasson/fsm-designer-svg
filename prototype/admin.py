from django.contrib import admin

from prototype.models import Client

from prototype.models import History

from prototype.models import MessageType

from prototype.models import Diagram

from prototype.models import State

from prototype.models import Transition

from prototype.models import FSMTrace

from prototype.models import FSMTraceReplay

from prototype.models import FiniteStateMachine

from prototype.models import Channel

from prototype.models import FiniteStateMachineState


class ClientAdmin(admin.ModelAdmin):
    fields = ()
    raw_id_fields = ()
admin.site.register(Client, ClientAdmin)


class HistoryAdmin(admin.ModelAdmin):
    fields = ('client', 'message_type', 'message_id',
              'message_data', 'undone', 'diagram',)
    raw_id_fields = ('client', 'message_type', 'diagram',)
admin.site.register(History, HistoryAdmin)


class MessageTypeAdmin(admin.ModelAdmin):
    fields = ('name',)
    raw_id_fields = ()
admin.site.register(MessageType, MessageTypeAdmin)


class DiagramAdmin(admin.ModelAdmin):
    fields = ('name', 'state_id_seq', 'transition_id_seq',
              'fsm_id_seq', 'channel_id_seq', 'uuid',)
    raw_id_fields = ()
admin.site.register(Diagram, DiagramAdmin)


class StateAdmin(admin.ModelAdmin):
    fields = ('diagram', 'name', 'id', 'x', 'y',)
    raw_id_fields = ('diagram',)
admin.site.register(State, StateAdmin)


class TransitionAdmin(admin.ModelAdmin):
    fields = ('from_state', 'to_state', 'label', 'id',)
    raw_id_fields = ('from_state', 'to_state',)
admin.site.register(Transition, TransitionAdmin)


class FSMTraceAdmin(admin.ModelAdmin):
    fields = ('fsm_name', 'from_state', 'to_state', 'message_type',
              'client', 'trace_session_id', 'order',)
    raw_id_fields = ('client',)
admin.site.register(FSMTrace, FSMTraceAdmin)


class FSMTraceReplayAdmin(admin.ModelAdmin):
    fields = ('replay_data',)
    raw_id_fields = ()
admin.site.register(FSMTraceReplay, FSMTraceReplayAdmin)


class FiniteStateMachineAdmin(admin.ModelAdmin):
    fields = ('diagram', 'name', 'x1', 'y1', 'x2', 'y2', 'id',)
    raw_id_fields = ('diagram',)
admin.site.register(FiniteStateMachine, FiniteStateMachineAdmin)


class ChannelAdmin(admin.ModelAdmin):
    fields = ('from_fsm', 'to_fsm', 'label', 'inbox', 'outbox', 'id',)
    raw_id_fields = ('from_fsm', 'to_fsm',)
admin.site.register(Channel, ChannelAdmin)


class FiniteStateMachineStateAdmin(admin.ModelAdmin):
    fields = ('finite_state_machine', 'state',)
    raw_id_fields = ('finite_state_machine', 'state',)
admin.site.register(FiniteStateMachineState, FiniteStateMachineStateAdmin)
