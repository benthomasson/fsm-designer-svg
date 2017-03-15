var app = angular.module('triangular', ['monospaced.mousewheel']);
var fsm = require('./fsm.js');
var view = require('./view.js');
var move = require('./move.js');
var link = require('./link.js');
var models = require('./models.js');

app.controller('MainCtrl', function($scope, $document) {

  $scope.control_socket = new WebSocket("ws://" + window.location.host + "/prototype/");
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
  $scope.pressedScaledX = 0;
  $scope.pressedScaledY = 0;
  $scope.lastPanX = 0;
  $scope.lastPanY = 0;
  $scope.selected_devices = [];
  $scope.selected_links = [];
  $scope.new_link = null;
  $scope.view_controller = new fsm.FSMController($scope, view.Start, null);
  $scope.move_controller = new fsm.FSMController($scope, move.Start, $scope.view_controller);
  $scope.link_controller = new fsm.FSMController($scope, link.Start, $scope.move_controller);
  $scope.first_controller = $scope.link_controller;
  $scope.last_key = "";
  $scope.last_key_code = null;
  $scope.last_event = null;
  $scope.cursor = {'x':100, 'y': 100, 'hidden': false};

  $scope.debug = {'hidden': true};
  $scope.graph = {'width': window.innerWidth,
                  'right_column': window.innerWidth - 300,
                  'height': window.innerHeight};
  $scope.devices = [
    new models.Device("R1", 15*4, 20*4, "router"),
    new models.Device("Rack1", 50*4, 60*4, "rack"),
    new models.Device("S1", 80*4, 10*4, "switch")
  ];

  $scope.links = [
    new models.Link($scope.devices[0], $scope.devices[1], false),
    new models.Link($scope.devices[1], $scope.devices[2], false),
    new models.Link($scope.devices[0], $scope.devices[2], false),
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

    $scope.updateScaledXY = function() {
        $scope.scaledX = ($scope.mouseX - $scope.panX) / $scope.current_scale;
        $scope.scaledY = ($scope.mouseY - $scope.panY) / $scope.current_scale;
    };

    $scope.clear_selections = function () {

        var i = 0;
        var devices = $scope.devices;
        var links = $scope.links;
        $scope.selected_devices = [];
        $scope.selected_links = [];
        for (i = 0; i < devices.length; i++) {
            devices[i].selected = false;
        }
        for (i = 0; i < links.length; i++) {
            links[i].selected = false;
        }
    };

    $scope.select_devices = function (multiple_selection) {

        var i = 0;
        var devices = $scope.devices;
        var last_selected_device = null;

        $scope.pressedX = $scope.mouseX;
        $scope.pressedY = $scope.mouseY;
        $scope.pressedScaledX = $scope.scaledX;
        $scope.pressedScaledY = $scope.scaledY;

        if (!multiple_selection) {
            $scope.clear_selections();
        }

        for (i = 0; i < devices.length; i++) {
            if (devices[i].is_selected($scope.scaledX, $scope.scaledY)) {
                devices[i].selected = true;
                last_selected_device = devices[i];
                if ($scope.selected_devices.indexOf(devices[i]) === -1) {
                    $scope.selected_devices.push(devices[i]);
                }
                if (!multiple_selection) {
                    break;
                }
            }
        }
        return last_selected_device;
    };


    // Event Handlers

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

    $scope.onKeyDown = function ($event) {
        $scope.last_event = $event;
        $scope.last_key = $event.key;
        $scope.last_key_code = $event.keyCode;
        $scope.first_controller.state.onKeyDown($scope.first_controller, $event);
        $scope.$apply();
        $event.preventDefault();
    };

    $document.bind("keydown", $scope.onKeyDown);

    $scope.control_socket.onmessage = function(e) {
		console.log(e.data);
	};
	$scope.control_socket.onopen = function() {
		$scope.control_socket.send("hello world");
	};
	// Call onopen directly if $scope.control_socket is already open
	if ($scope.control_socket.readyState === WebSocket.OPEN) {
		$scope.control_socket.onopen();
	}
});

exports.app = app;
