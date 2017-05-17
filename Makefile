.PHONY: ui tools docker-compose-build docker-compose

tools:
	sudo npm i -g less
	sudo npm i -g browserify
	sudo npm i -g jshint

ui:
	cd prototype/static/prototype; npm i; make


docker-compose-build:
	docker-compose build

docker-compose:
	docker-compose up

docker-compose-fix:
	docker exec -it --user root fsmdesignersvg_django_1 chown -R django.django /app
	docker exec -it fsmdesignersvg_django_1 /entrypoint.sh /app/manage.py collectstatic --noinput
