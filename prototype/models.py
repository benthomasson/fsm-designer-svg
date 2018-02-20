from django.db import models


class Client(models.Model):

    client_id = models.AutoField(primary_key=True,)


class History(models.Model):

    history_id = models.AutoField(primary_key=True,)
    client = models.ForeignKey('Client',)
    message_type = models.ForeignKey('MessageType',)
    message_id = models.IntegerField()
    message_data = models.TextField()
    undone = models.BooleanField(default=False)
    diagram = models.ForeignKey('Diagram',)


class MessageType(models.Model):

    message_type_id = models.AutoField(primary_key=True,)
    name = models.CharField(max_length=200, )

    def __unicode__(self):
        return self.name


class Diagram(models.Model):

    diagram_id = models.AutoField(primary_key=True,)
    name = models.CharField(max_length=200, )
    state_id_seq = models.IntegerField(default=0)
    transition_id_seq = models.IntegerField(default=0)
    fsm_id_seq = models.IntegerField(default=0)
    channel_id_seq = models.IntegerField(default=0)

    def __unicode__(self):
        return self.name


class State(models.Model):

    state_id = models.AutoField(primary_key=True,)
    diagram = models.ForeignKey('Diagram',)
    name = models.CharField(max_length=200, )
    id = models.IntegerField()
    x = models.IntegerField()
    y = models.IntegerField()

    def __unicode__(self):
        return self.name


class Transition(models.Model):

    transition_id = models.AutoField(primary_key=True,)
    from_state = models.ForeignKey('State',  related_name='from_transition', )
    to_state = models.ForeignKey('State',  related_name='to_transition', )
    label = models.CharField(max_length=200, )
    id = models.IntegerField()

    def __unicode__(self):
        return self.label


class FSMTrace(models.Model):

    fsm_trace_id = models.AutoField(primary_key=True,)
    fsm_name = models.CharField(max_length=200, )
    from_state = models.CharField(max_length=200, )
    to_state = models.CharField(max_length=200, )
    message_type = models.CharField(max_length=200, )
    client = models.ForeignKey('Client',)
    trace_session_id = models.IntegerField(default=0)
    order = models.IntegerField(default=0)


class FSMTraceReplay(models.Model):

    fsm_trace_replay_id = models.AutoField(primary_key=True,)
    replay_data = models.TextField()


class FiniteStateMachine(models.Model):

    finite_state_machine_id = models.AutoField(primary_key=True,)
    diagram = models.ForeignKey('Diagram',)
    name = models.CharField(max_length=200, )
    x1 = models.IntegerField()
    y1 = models.IntegerField()
    x2 = models.IntegerField()
    y2 = models.IntegerField()
    id = models.IntegerField(default=0)


class Channel(models.Model):

    channel_id = models.AutoField(primary_key=True,)
    from_fsm = models.ForeignKey('FiniteStateMachine',  related_name='from_channel', )
    to_fsm = models.ForeignKey('FiniteStateMachine',  related_name='to_channel', )
    label = models.CharField(max_length=200, )
    inbox = models.CharField(max_length=200, )
    outbox = models.CharField(max_length=200, )
    id = models.IntegerField(default=0)


class FiniteStateMachineState(models.Model):

    finite_state_machine_state_id = models.AutoField(primary_key=True,)
    finite_state_machine = models.ForeignKey('FiniteStateMachine',)
    state = models.ForeignKey('State',)
