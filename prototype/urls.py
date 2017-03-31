from django.conf.urls import include, url

from . import views

app_name = 'prototype'
urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^fsm$', views.fsm, name='fsm'),
]
