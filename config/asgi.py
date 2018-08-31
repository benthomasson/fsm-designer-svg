import os
import asgi_ipc as asgi

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")


channel_layer = asgi.IPCChannelLayer(prefix="fsm-designer-svg",
                                     message_memory=200 * 1024 * 1024)
