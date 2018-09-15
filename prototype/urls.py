from django.urls import path

from . import views

app_name = 'prototype'
urlpatterns = [
    path(r'', views.index, name='index'),
    path(r'download_pipeline', views.download_pipeline, name='download_pipeline'),
    path(r'download_replay', views.download_replay, name='download_replay'),
    path(r'download_trace', views.download_trace, name='download_trace'),
    path(r'upload_trace', views.upload_trace, name='upload_trace'),
    path(r'upload_pipeline', views.upload_pipeline, name='upload_pipeline'),
    path(r'download', views.download, name='download'),
    path(r'upload', views.upload, name='upload'),
]
