.PHONY: all main lint lessc

all: clean lessc lint main

clean:
	rm -f js/bundle.js
	rm -f css/style.css

main:
	browserify main.js  --standalone main -o js/bundle.js
	cp vendor/*.js js/

lint:
	jshint --verbose main.js app.js view.js fsm.js models.js move.js link.js button.js buttons.js util.js messages.js

lessc:
	lessc style.less css/style.css
