.PHONY: all main lint lessc

all: clean lessc lint main

clean:
	rm bundle.js
	rm style.css

main:
	browserify main.js  --standalone main -o bundle.js

lint:
	jshint --verbose main.js app.js view.js fsm.js models.js move.js link.js button.js buttons.js util.js messages.js

lessc:
	lessc style.less style.css
