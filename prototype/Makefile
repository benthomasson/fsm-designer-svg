.PHONY: all main lint

all: main

main:
	browserify main.js  --standalone main -o bundle.js

lint:
	jshint --verbose hamster.js main.js app.js
