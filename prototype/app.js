var app = angular.module('triangular', ['monospaced.mousewheel']);
var fsm = require('./fsm.js');
var view = require('./view.js');
var move = require('./move.js');
var models = require('./models.js');

app.controller('MainCtrl', function($scope, $document) {

  $scope.onMouseDownResult = "";
  $scope.onMouseUpResult = "";
  $scope.onMouseEnterResult = "";
  $scope.onMouseLeaveResult = "";
  $scope.onMouseMoveResult = "";
  $scope.onMouseMoveResult = "";
  $scope.current_scale = 1.0;
  $scope.mouseX = 0;
  $scope.mouseY = 0;
  $scope.scaledX = 0;
  $scope.scaledY = 0;
  $scope.panX = 0;
  $scope.panY = 0;
  $scope.pressedX = 0;
  $scope.pressedY = 0;
  $scope.lastPanX = 0;
  $scope.lastPanY = 0;
  $scope.selected_devices = [];
  $scope.selected_links = [];
  $scope.view_controller = new fsm.FSMController($scope, view.Start, null);
  $scope.move_controller = new fsm.FSMController($scope, move.Start, $scope.view_controller);
  $scope.first_controller = $scope.move_controller;
  $scope.last_key = "";
  $scope.last_key_code = null;
  $scope.last_event = null;
  $scope.cursor = {'x':100, 'y': 100, 'hidden': false};

  $scope.debug = {'hidden': true};
  $scope.graph = {'width': window.innerWidth,
                  'right_column': window.innerWidth - 300,
                  'height': window.innerHeight};
  $scope.devices = [
    new models.Device(15, 20, 15, false),
    new models.Device(50, 60, 15, false),
    new models.Device(80, 10, 15, false)
  ];

  $scope.links = [
    new models.Link(15, 20, 50, 60, false),
    new models.Link(50, 60, 80, 10, false),
    new models.Link(15, 20, 80, 10, false)
  ];


    // Utility functions

    // Accepts a MouseEvent as input and returns the x and y
    // coordinates relative to the target element.
    var getCrossBrowserElementCoords = function (mouseEvent)
    {
      var result = {
        x: 0,
        y: 0
      };

      if (!mouseEvent)
      {
        mouseEvent = window.event;
      }

      if (mouseEvent.pageX || mouseEvent.pageY)
      {
        result.x = mouseEvent.pageX;
        result.y = mouseEvent.pageY;
      }
      else if (mouseEvent.clientX || mouseEvent.clientY)
      {
        result.x = mouseEvent.clientX + document.body.scrollLeft +
          document.documentElement.scrollLeft;
        result.y = mouseEvent.clientY + document.body.scrollTop +
          document.documentElement.scrollTop;
      }

      return result;
    };

    var getMouseEventResult = function (mouseEvent) {
      var coords = getCrossBrowserElementCoords(mouseEvent);
      return "(" + coords.x + ", " + coords.y + ")";
    };

    $scope.onMouseDown = function ($event) {
      $scope.last_event = $event;
      $scope.first_controller.state.onMouseDown($scope.first_controller, $event);
      $scope.onMouseDownResult = getMouseEventResult($event);
	  $event.preventDefault();
    };

    $scope.onMouseUp = function ($event) {
      $scope.last_event = $event;
      $scope.first_controller.state.onMouseUp($scope.first_controller, $event);
      $scope.onMouseUpResult = getMouseEventResult($event);
	  $event.preventDefault();
    };

    $scope.onMouseEnter = function ($event) {
      $scope.onMouseEnterResult = getMouseEventResult($event);
      $scope.cursor.hidden = false;
	  $event.preventDefault();
    };

    $scope.onMouseLeave = function ($event) {
      $scope.onMouseLeaveResult = getMouseEventResult($event);
      $scope.cursor.hidden = true;
	  $event.preventDefault();
    };

    $scope.updateScaledXY = function() {
        $scope.scaledX = ($scope.mouseX - $scope.panX) / $scope.current_scale;
        $scope.scaledY = ($scope.mouseY - $scope.panY) / $scope.current_scale;
    };

    $scope.onMouseMove = function ($event) {
      var coords = getCrossBrowserElementCoords($event);
      $scope.cursor.hidden = false;
      $scope.cursor.x = coords.x;
      $scope.cursor.y = coords.y;
      $scope.mouseX = coords.x;
      $scope.mouseY = coords.y;
      $scope.updateScaledXY();
      $scope.first_controller.state.onMouseMove($scope.first_controller, $event);
      $scope.onMouseMoveResult = getMouseEventResult($event);
	  $event.preventDefault();
    };

    $scope.onMouseOver = function ($event) {
      $scope.onMouseOverResult = getMouseEventResult($event);
      $scope.cursor.hidden = false;
	  $event.preventDefault();
    };

    $scope.onMouseWheel = function ($event, delta, deltaX, deltaY) {
      $scope.last_event = $event;
      $scope.first_controller.state.onMouseWheel($scope.first_controller, $event, delta, deltaX, deltaY);
      event.preventDefault();
    };

    $scope.onKeyUp = function ($event) {
      $scope.last_event = $event;
        if ($event.key === 'd') {
            $scope.debug.hidden = !$scope.debug.hidden;
        }
        if ($event.key === 'p') {
            $scope.cursor.hidden = !$scope.cursor.hidden;
        }
        if ($event.key === 'a') {
            $scope.devices.push(new models.Device($scope.scaledX, $scope.scaledY, 15, false));
        }
        $scope.last_key = $event.key;
        $scope.last_key_code = $event.keyCode;
        $scope.$apply();
        $event.preventDefault();
    };

    $document.bind("keypress", $scope.onKeyUp);
});

exports.app = app;
