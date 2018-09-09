
//console.log = function () { };
var controller = require('./controller.js');
var cursor = require('./core/cursor.directive.js');
var debug = require('./core/debug.directive.js');
var help = require('./core/help.directive.js');
var quadrants = require('./core/quadrants.directive.js');

var state = require('./fsm/state.directive.js');
var transition = require('./fsm/transition.directive.js');
var channel = require('./fsm/channel.directive.js');

var app = angular.module('triangular', ['monospaced.mousewheel'])
                 .controller('MainCtrl', controller.MainCtrl)
                 .directive('cursor', cursor.cursor)
                 .directive('debug', debug.debug)
                 .directive('help', help.help)
                 .directive('state', state.state)
                 .directive('fsmTransition', transition.transition)
                 .directive('fsmChannel', channel.channel)
                 .directive('quadrants', quadrants.quadrants);




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
