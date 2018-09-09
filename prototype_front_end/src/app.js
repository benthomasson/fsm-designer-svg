
//console.log = function () { };
var controller = require('./controller.js');
var cursor = require('./core/cursor.directive.js');
var debug = require('./core/debug.directive.js');
var help = require('./core/help.directive.js');

var app = angular.module('triangular', ['monospaced.mousewheel'])
                 .controller('MainCtrl', controller.MainCtrl)
                 .directive('cursor', cursor.cursor)
                 .directive('debug', debug.debug)
                 .directive('help', help.help);

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
