.PHONY: all main lint

all: main

main:
	browserify main.js  --standalone main -o bundle.js

generate:
	fsm-designer generate-js --template templates/fsm.jst designs/view.yml view.js

lint:
	jshint --verbose hamster.js main.js app.js
