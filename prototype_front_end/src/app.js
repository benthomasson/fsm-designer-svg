
//console.log = function () { };
var app = angular.module('triangular', ['monospaced.mousewheel']);
var controller = require('./controller.js');

app.controller('MainCtrl', controller.MainCtrl);

app.directive('cursor', function() {
  return { restrict: 'A', templateUrl: 'widgets/cursor.html' };
});

app.directive('debug', function() {
  return { restrict: 'A', templateUrl: 'widgets/debug.html' };
});

app.directive('help', function() {
  return { restrict: 'A', templateUrl: 'widgets/help.html' };
});

app.directive('state', function() {
  return { restrict: 'A', templateUrl: 'widgets/state.html' };
});

app.directive('fsmTransition', function() {
  return { restrict: 'A', templateUrl: 'widgets/transition.html' };
});

app.directive('fsmChannel', function() {
  return { restrict: 'A', templateUrl: 'widgets/channel.html' };
});

app.directive('quadrants', function() {
  return { restrict: 'A', templateUrl: 'widgets/quadrants.html' };
});

app.directive('download', function() {
  return { restrict: 'A', templateUrl: 'widgets/download.svg' };
});

app.directive('upload', function() {
  return { restrict: 'A', templateUrl: 'widgets/upload.svg' };
});

app.directive('fsmGroup', function() {
  return { restrict: 'A', templateUrl: 'widgets/group.html' };
});

app.directive('fsmFsm', function() {
  return { restrict: 'A', templateUrl: 'widgets/fsm.html' };
});

app.directive('fsmSlider', function() {
  return { restrict: 'A', templateUrl: 'widgets/slider.html' };
});

app.directive('fsmPlayPause', function() {
  return { restrict: 'A', templateUrl: 'widgets/playpause.html' };
});

exports.app = app;
