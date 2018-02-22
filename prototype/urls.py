from django.conf.urls import include, url

from . import views

app_name = 'prototype'
urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^download_pipeline$', views.download_pipeline, name='download_pipeline'),
    url(r'^download_replay$', views.download_replay, name='download_replay'),
    url(r'^download_trace$', views.download_trace, name='download_trace'),
    url(r'^upload_trace$', views.upload_trace, name='upload_trace'),
    url(r'^upload_pipeline$', views.upload_pipeline, name='upload_pipeline'),
    url(r'^download$', views.download, name='download'),
    url(r'^upload$', views.upload, name='upload'),
]
