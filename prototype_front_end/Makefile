.PHONY: all main lint lessc deploy extract diff

all: clean lessc lint main

clean:
	rm -f js/bundle.js
	rm -f js/vendor.bundle.js
	rm -f css/style.css

install:
	npm i

main:
	webpack

lint:
	jshint --verbose src/*js

lessc:
	lessc src/style.less css/style.css

extract:
	mkdir -p extracted
	./extract.js ./src/button.js > extracted/button.yml
	./extract.js ./src/button.js > extracted/button.yml
	./extract.js ./src/buttons.js > extracted/buttons.yml
	./extract.js ./src/transition.js > extracted/transition.yml
	./extract.js ./src/move.js > extracted/move.yml
	./extract.js ./src/view.js > extracted/view.yml
	./extract.js ./src/time.js > extracted/time.yml

diff:
	fsm_diff designs/button.yml extracted/button.yml
	fsm_diff designs/buttons.yml extracted/buttons.yml
	fsm_diff designs/transition.yml extracted/transition.yml
	fsm_diff designs/move.yml extracted/move.yml
	fsm_diff designs/time.yml extracted/time.yml
	fsm_diff designs/view.yml extracted/view.yml

deploy: main
	rsync -av js ../prototype/static/prototype/
	rsync -av css ../prototype/static/prototype/
	rsync -av index.html ../prototype/static/prototype/
	rsync -av favicon.ico ../prototype/static/prototype/
	docker-compose -f ../local.yml run --rm django ./manage.py collectstatic --noinput
