# In consumers.py
from channels import Group, Channel
from channels.sessions import channel_session
from prototype.models import Topology, Device, Link
from pprint import pprint
import urlparse
from django.db.models import Q, F

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
    topology_id = topology.topology_id
    message.channel_session['topology_id'] = topology_id
    message.channel_session['room'] = room
    Group("topology-%s" % room).add(message.reply_channel)
    message.reply_channel.send({"text": json.dumps(["id", next(next_id)])})
    message.reply_channel.send({"text": json.dumps(["topology_id", topology_id])})
    topology_data = topology.__dict__.copy()
    del topology_data['_state']
    message.reply_channel.send({"text": json.dumps(["topology", topology_data])})
    snapshot = dict(devices=list(Device.objects.filter(topology_id=topology_id).values()),
                    links=[dict(from_device=x['from_device__id'],
                                to_device=x['to_device__id']) for x in list(Link.objects
                                   .filter(Q(from_device__topology_id=topology_id)|Q(to_device__topology_id=topology_id))
                                   .values('from_device__id', 'to_device__id'))])
    pprint(snapshot)
    message.reply_channel.send({"text": json.dumps(["Snapshot", snapshot])})

# Connected to websocket.receive
@channel_session
def ws_message(message):
    # Send to debug printer
    Channel('console_printer').send({"text": message['text']})
    # Send to all clients editing the topology
    Group("topology-%s" % message.channel_session['room']).send({
        "text": message['text'],
    })
    # Send to persistence worker
    Channel('persistence').send({"text": message['text'], "topology": message.channel_session['topology_id']})

# Connected to websocket.disconnect
@channel_session
def ws_disconnect(message):
    Group("topology-%s" % message.channel_session['room']).discard(message.reply_channel)

def console_printer(message):
    print message['text']

def persistence(message):
    topology_id = message.get('topology')
    if topology_id is None:
        return
    data = json.loads(message['text'])
    if data[0] == "Snapshot":
        device_map = dict()
        for device in data[1]['devices']:
            del device['size']
            d, _ = Device.objects.get_or_create(topology_id=topology_id, id=device['id'], defaults=device)
            d.name = device['name']
            d.x = device['x']
            d.y = device['y']
            d.type = device['type']
            d.save()
            device_map[device['id']] = d

        for link in data[1]['links']:
            Link.objects.get_or_create(from_device=device_map[link['from_device']],
                                       to_device=device_map[link['to_device']])


    if data[0] == "DeviceMove":
        device = data[1]
        Device.objects.filter(topology_id=topology_id, id=device['id']).update(x=device['x'], y=device['y'])
