from channels.routing import route
from prototype.consumers import ws_connect, ws_message, ws_disconnect, console_printer

channel_routing = [
        route("websocket.connect", ws_connect),
        route("websocket.receive", ws_message),
        route("websocket.disconnect", ws_disconnect),
        route("console_printer", console_printer),
]
