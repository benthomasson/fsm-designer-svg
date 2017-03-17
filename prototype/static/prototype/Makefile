.PHONY: all main lint lessc

all: lessc lint main

main:
	browserify main.js  --standalone main -o bundle.js

lint:
	jshint --verbose hamster.js main.js app.js view.js fsm.js models.js move.js link.js button.js buttons.js util.js messages.js

lessc:
	lessc style.less style.css
