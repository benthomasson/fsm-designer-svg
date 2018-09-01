.PHONY: ui tools docker-compose-build docker-compose

tools:
	sudo npm i -g less
	sudo npm i -g browserify
	sudo npm i -g jshint

ui:
	cd prototype_front_end; npm i; make deploy


docker-compose-build: ui
	docker-compose build

docker-compose:
	docker-compose up
