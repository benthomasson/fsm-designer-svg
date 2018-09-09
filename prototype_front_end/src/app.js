
//console.log = function () { };
var controller = require('./controller.js');
var cursor = require('./core/cursor.directive.js');
var debug = require('./core/debug.directive.js');
var help = require('./core/help.directive.js');
var quadrants = require('./core/quadrants.directive.js');

var state = require('./fsm/state.directive.js');
var transition = require('./fsm/transition.directive.js');
var channel = require('./fsm/channel.directive.js');
var group = require('./fsm/group.directive.js');
var fsm = require('./fsm/fsm.directive.js');
var slider = require('./fsm/slider.directive.js');
var playpause = require('./fsm/playpause.directive.js');
var download = require('./fsm/download.directive.js');
var upload = require('./fsm/upload.directive.js');

var app = angular.module('triangular', ['monospaced.mousewheel'])
                 .controller('MainCtrl', controller.MainCtrl)
                 .directive('cursor', cursor.cursor)
                 .directive('debug', debug.debug)
                 .directive('help', help.help)
                 .directive('quadrants', quadrants.quadrants)
                 .directive('state', state.state)
                 .directive('fsmTransition', transition.transition)
                 .directive('fsmChannel', channel.channel)
                 .directive('fsmGroup', group.group)
                 .directive('fsmFsm', fsm.fsm)
                 .directive('fsmSlider', slider.slider)
                 .directive('fsmPlayPause', playpause.playpause)
                 .directive('download', download.download)
                 .directive('upload', upload.upload)

;








exports.app = app;
