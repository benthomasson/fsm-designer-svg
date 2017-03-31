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
    finite_state_machine = models.ForeignKey('FiniteStateMachine',)


class MessageType(models.Model):

    message_type_id = models.AutoField(primary_key=True,)
    name = models.CharField(max_length=200, )

    def __unicode__(self):
        return self.name


class FiniteStateMachine(models.Model):

    finite_state_machine_id = models.AutoField(primary_key=True,)
    name = models.CharField(max_length=200, )

    def __unicode__(self):
        return self.name


class State(models.Model):

    state_id = models.AutoField(primary_key=True,)
    finite_state_machine = models.ForeignKey('FiniteStateMachine',)
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

    def __unicode__(self):
        return self.name
