from django.contrib import admin

from prototype.models import Client

from prototype.models import History

from prototype.models import MessageType

from prototype.models import FiniteStateMachine

from prototype.models import State

from prototype.models import Transition


class ClientAdmin(admin.ModelAdmin):
    fields = ()
    raw_id_fields = ()


admin.site.register(Client, ClientAdmin)


class HistoryAdmin(admin.ModelAdmin):
    fields = ('client', 'message_type', 'message_id', 'message_data', 'undone', 'finite_state_machine',)
    raw_id_fields = ('client', 'message_type', 'finite_state_machine',)


admin.site.register(History, HistoryAdmin)


class MessageTypeAdmin(admin.ModelAdmin):
    fields = ('name',)
    raw_id_fields = ()


admin.site.register(MessageType, MessageTypeAdmin)


class FiniteStateMachineAdmin(admin.ModelAdmin):
    fields = ('name',)
    raw_id_fields = ()


admin.site.register(FiniteStateMachine, FiniteStateMachineAdmin)


class StateAdmin(admin.ModelAdmin):
    fields = ('finite_state_machine', 'name', 'id', 'x', 'y',)
    raw_id_fields = ('finite_state_machine',)


admin.site.register(State, StateAdmin)


class TransitionAdmin(admin.ModelAdmin):
    fields = ('from_state', 'to_state', 'label', 'id',)
    raw_id_fields = ('from_state', 'to_state',)


admin.site.register(Transition, TransitionAdmin)
