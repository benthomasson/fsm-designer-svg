from django.db import models


class Client(models.Model):

    client_id = models.AutoField(primary_key=True,)


class History(models.Model):

    history_id = models.AutoField(primary_key=True,)
    client = models.ForeignKey('Client', on_delete=models.CASCADE,)
    message_type = models.ForeignKey('MessageType', on_delete=models.CASCADE,)
    message_id = models.IntegerField()
    message_data = models.TextField()
    undone = models.BooleanField(default=False,)
    diagram = models.ForeignKey('Diagram', on_delete=models.CASCADE,)


class MessageType(models.Model):

    message_type_id = models.AutoField(primary_key=True,)
    name = models.CharField(max_length=200, blank=True,)

    def __unicode__(self):
        return self.name


class Diagram(models.Model):

    diagram_id = models.AutoField(primary_key=True,)
    name = models.CharField(max_length=200, blank=True,)
    state_id_seq = models.IntegerField(default=0,)
    transition_id_seq = models.IntegerField(default=0,)
    fsm_id_seq = models.IntegerField(default=0,)
    channel_id_seq = models.IntegerField(default=0,)
    uuid = models.CharField(max_length=40, blank=True,)

    def __unicode__(self):
        return self.name


class State(models.Model):

    state_id = models.AutoField(primary_key=True,)
    diagram = models.ForeignKey('Diagram', on_delete=models.CASCADE,)
    name = models.CharField(max_length=200, blank=True,)
    id = models.IntegerField()
    x = models.IntegerField()
    y = models.IntegerField()

    def __unicode__(self):
        return self.name


class Transition(models.Model):

    transition_id = models.AutoField(primary_key=True,)
    from_state = models.ForeignKey(
        'State', related_name='from_transition', on_delete=models.CASCADE,)
    to_state = models.ForeignKey(
        'State', related_name='to_transition', on_delete=models.CASCADE,)
    label = models.CharField(max_length=200, blank=True,)
    id = models.IntegerField()

    def __unicode__(self):
        return self.label


class FSMTrace(models.Model):

    fsm_trace_id = models.AutoField(primary_key=True,)
    fsm_name = models.CharField(max_length=200, blank=True,)
    from_state = models.CharField(max_length=200, blank=True,)
    to_state = models.CharField(max_length=200, blank=True,)
    message_type = models.CharField(max_length=200, blank=True,)
    client = models.ForeignKey('Client', on_delete=models.CASCADE,)
    trace_session_id = models.IntegerField(default=0,)
    order = models.IntegerField(default=0,)


class FSMTraceReplay(models.Model):

    fsm_trace_replay_id = models.AutoField(primary_key=True,)
    replay_data = models.TextField()


class FiniteStateMachine(models.Model):

    finite_state_machine_id = models.AutoField(primary_key=True,)
    diagram = models.ForeignKey('Diagram', on_delete=models.CASCADE,)
    name = models.CharField(max_length=200, blank=True,)
    x1 = models.IntegerField()
    y1 = models.IntegerField()
    x2 = models.IntegerField()
    y2 = models.IntegerField()
    id = models.IntegerField(default=0,)


class Channel(models.Model):

    channel_id = models.AutoField(primary_key=True,)
    from_fsm = models.ForeignKey(
        'FiniteStateMachine', related_name='from_channel', on_delete=models.CASCADE,)
    to_fsm = models.ForeignKey(
        'FiniteStateMachine', related_name='to_channel', on_delete=models.CASCADE,)
    label = models.CharField(max_length=200, blank=True,)
    inbox = models.CharField(max_length=200, blank=True,)
    outbox = models.CharField(max_length=200, blank=True,)
    id = models.IntegerField(default=0,)


class FiniteStateMachineState(models.Model):

    finite_state_machine_state_id = models.AutoField(primary_key=True,)
    finite_state_machine = models.ForeignKey(
        'FiniteStateMachine', on_delete=models.CASCADE,)
    state = models.ForeignKey('State', on_delete=models.CASCADE,)
