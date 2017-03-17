

.PHONY: all main

all: main

main:
	jinja2 templates/models.pyt designs/models.yml > models.py
	autopep8 -i models.py
