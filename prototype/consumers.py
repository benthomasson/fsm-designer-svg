# In consumers.py
from channels import Group, Channel
from channels.sessions import channel_session

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
    message.channel_session['room'] = room
    Group("chat-%s" % room).add(message.reply_channel)
    message.reply_channel.send({"text": json.dumps(["id", next(next_id)])})

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
