# In consumers.py
from channels import Group, Channel
from channels.sessions import channel_session
from prototype.models import Topology
from pprint import pprint
import urlparse

def _next_id():
    i = 0
    while True:
        i += 1
        yield i

next_id = _next_id()

import json
# Connected to websocket.connect
@channel_session
def ws_connect(message):
    # Accept connection
    message.reply_channel.send({"accept": True})
    # Work out room name from path (ignore slashes)
    room = message.content['path'].strip("/")
    pprint(sorted(message.content.keys()))
    for key in sorted(message.content.keys()):
        print key, message.content[key]
    print urlparse.parse_qs(message.content['query_string'])
    print type(message.content['query_string'])
    # Save room in session and add us to the group
    data = urlparse.parse_qs(message.content['query_string'])
    topology_id = data.get('topology_id', ['null'])
    try:
        topology_id = int(topology_id[0])
    except ValueError:
        topology_id = None
    if not topology_id:
        topology_id = None
    topology, created = Topology.objects.get_or_create(topology_id=topology_id, defaults=dict(name="topology", scale=1.0, panX=0, panY=0))
    print topology, created, topology.pk
    topology_id = topology.topology_id
    message.channel_session['topology_id'] = topology_id
    message.channel_session['room'] = room
    Group("chat-%s" % room).add(message.reply_channel)
    message.reply_channel.send({"text": json.dumps(["id", next(next_id)])})
    message.reply_channel.send({"text": json.dumps(["topology_id", topology_id])})
    pprint(topology.__dict__)
    topology_data = topology.__dict__.copy()
    del topology_data['_state']
    message.reply_channel.send({"text": json.dumps(["topology", topology_data])})

# Connected to websocket.receive
@channel_session
def ws_message(message):
    Channel('console_printer').send({"text": message['text']})
    Group("chat-%s" % message.channel_session['room']).send({
        "text": message['text'],
    })
    data = json.loads(message['text'])
    if data[0] == "save":
        message.reply_channel.send({
            "text": json.dumps(["save", {'id': 1}])
        })

# Connected to websocket.disconnect
@channel_session
def ws_disconnect(message):
    Group("chat-%s" % message.channel_session['room']).discard(message.reply_channel)

def console_printer(message):
    print message['text']
