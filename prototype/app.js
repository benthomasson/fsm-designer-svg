var app = angular.module('triangular', ['monospaced.mousewheel']);
var fsm = require('./fsm.js');
var view = require('./view.js');

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
  $scope.view_controller = new fsm.FSMController($scope, view.Start);
  $scope.cursor = {'x':100, 'y': 100, 'hidden': false};

  $scope.debug = {'hidden': false};
  $scope.graph = {'width': window.innerWidth,
                  'right_column': window.innerWidth - 300,
                  'height': window.innerHeight};
  $scope.devices = [
  	{'x': 15, 'y': 20, 'r':15},
  	{'x': 50, 'y': 60, 'r':15},
  	{'x': 80, 'y': 10, 'r':15},
  ];

  $scope.links = [
  	{'x1': 15, 'y1': 20, 'x2': 50, 'y2': 60},
  	{'x1': 50, 'y1': 60, 'x2': 80, 'y2': 10},
  	{'x1': 15, 'y1': 20, 'x2': 80, 'y2': 10},
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
      $scope.view_controller.state.onMouseDown($scope.view_controller);
      $scope.onMouseDownResult = getMouseEventResult($event);
	  $event.preventDefault();
    };

    $scope.onMouseUp = function ($event) {
      $scope.view_controller.state.onMouseUp($scope.view_controller);
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
      $scope.view_controller.state.onMouseMove($scope.view_controller);
      $scope.onMouseMoveResult = getMouseEventResult($event);
	  $event.preventDefault();
    };

    $scope.onMouseOver = function ($event) {
      $scope.onMouseOverResult = getMouseEventResult($event);
      $scope.cursor.hidden = false;
	  $event.preventDefault();
    };

    $scope.onMouseWheel = function (event, delta, deltaX, deltaY) {
      $scope.view_controller.state.onMouseWheel($scope.view_controller, event, delta, deltaX, deltaY);
      event.preventDefault();
    };

    $scope.onKeyUp = function (event) {
        if (event.key === 'd') {
            $scope.debug.hidden = !$scope.debug.hidden;
        }
        if (event.key === 'p') {
            $scope.cursor.hidden = !$scope.cursor.hidden;
        }
        if (event.key === 'a') {
            $scope.devices.push({'x': $scope.scaledX, 'y': $scope.scaledY, 'r': 15});
        }
        $scope.$apply();
        event.preventDefault();
    };

    $document.bind("keypress", $scope.onKeyUp);
});

exports.app = app;
