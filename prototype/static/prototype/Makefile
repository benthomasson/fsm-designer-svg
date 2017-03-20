.PHONY: all main lint lessc

all: clean lessc lint main

clean:
	rm -f js/bundle.js
	rm -f css/style.css

main:
	browserify src/main.js  --standalone main -o js/bundle.js
	cp vendor/*.js js/

lint:
	jshint --verbose src/*js

lessc:
	lessc src/style.less css/style.css
