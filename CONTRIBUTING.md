
Git Repositories
----------------

* UI and Django: git@github.com:benthomasson/fsm-designer-svg.git
* UI only: git@github.com:benthomasson/svg-test.git



Push to main repo:

    $ git push


Push to UI repo:

    $ git subtree push --prefix prototype/static git@github.com:benthomasson/svg-test.git master



Virtual Environment Installation
--------------------------------




Ubuntu:


sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" >> /etc/apt/sources.list.d/pgdg.list'
wget -q https://www.postgresql.org/media/keys/ACCC4CF8.asc -O - | sudo apt-key add -
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo apt-get install postgresql-server-dev-9.6
sudo apt-get install libjpeg-dev zlib1g-dev
pip install -r requirements/local.txt


make tools
make ui



Docker Compose Installation
---------------------------


cp env.example .env
vim .env
# Change DJANGO_ALLOWED_HOSTS to the hostname of the machine

make tools
make ui
make docker-compose-build
make docker-compose

In a new terminal:
make docker-compose-fix

Browse to server:

http://hostname:80/static/prototype/index.html


