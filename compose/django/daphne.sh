#!/bin/sh
python /app/manage.py syncdb
python /app/manage.py migrate
python /app/manage.py collectstatic --noinput
/usr/local/bin/daphne config.asgi:channel_layer -p 5000 -b 0.0.0.0 --root-path=/app
