
//console.log = function () { };
var app = angular.module('triangular', ['monospaced.mousewheel']);
var fsm = require('./fsm.js');
var view = require('./view.js');
var move = require('./move.js');
var link = require('./link.js');
var buttons = require('./buttons.js');
var util = require('./util.js');
var models = require('./models.js');

app.controller('MainCtrl', function($scope, $document, $location) {

  $scope.control_socket = new WebSocket("ws://" + window.location.host + "/prototype/");
  $scope.client_id = 0;
  $scope.onMouseDownResult = "";
  $scope.onMouseUpResult = "";
  $scope.onMouseEnterResult = "";
  $scope.onMouseLeaveResult = "";
  $scope.onMouseMoveResult = "";
  $scope.onMouseMoveResult = "";
  $scope.current_scale = 1.0;
  $scope.panX = 0;
  $scope.panY = 0;
  $scope.mouseX = 0;
  $scope.mouseY = 0;
  $scope.scaledX = 0;
  $scope.scaledY = 0;
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
  $scope.buttons_controller = new fsm.FSMController($scope, buttons.Start, $scope.link_controller);
  $scope.first_controller = $scope.buttons_controller;
  $scope.last_key = "";
  $scope.last_key_code = null;
  $scope.last_event = null;
  $scope.cursor = {'x':100, 'y': 100, 'hidden': false};

  $scope.debug = {'hidden': true};
  $scope.graph = {'width': window.innerWidth,
                  'right_column': window.innerWidth - 300,
                  'height': window.innerHeight};
  $scope.device_id_seq = util.natural_numbers();
  $scope.devices = [
    new models.Device($scope.device_id_seq(), "R1", 15*4, 20*4, "router"),
    new models.Device($scope.device_id_seq(), "Rack1", 50*4, 60*4, "rack"),
    new models.Device($scope.device_id_seq(), "S1", 80*4, 10*4, "switch")
  ];

  $scope.stencils = [
    {"name": "router", "size":50, 'x':10, 'y':100},
    {"name": "switch", "size":50, 'x':10, 'y':160},
    {"name": "rack", "size":50, 'x':10, 'y':220},
  ];

  $scope.layers = [
    {"name": "Layer 3", "size":60, 'x':window.innerWidth - 70, 'y':10},
    {"name": "Layer 2", "size":60, 'x':window.innerWidth - 70, 'y':80},
    {"name": "Layer 1", "size":60, 'x':window.innerWidth - 70, 'y':150},
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

    // Button Event Handlers

    $scope.onSaveButton = function (button) {
        console.log(button.name);
        $scope.control_socket.send(JSON.stringify(['save', {"devices": $scope.devices,
                                                            "links": $scope.links,
                                                            "scale": $scope.scale,
                                                            "panX": $scope.panX,
                                                            "panY": $scope.panY}]));
    };

    $scope.onLoadButton = function (button) {
        console.log(button.name);
    };

    $scope.onDeployButton = function (button) {
        console.log(button.name);
    };

    // Buttons

    $scope.buttons = [
      new models.Button("Save", 10, 10, 50, 50, $scope.onSaveButton),
      new models.Button("Load", 70, 10, 50, 50, $scope.onLoadButton),
      new models.Button("Deploy", 130, 10, 60, 50, $scope.onDeployButton)
    ];


    // Create a web socket to connect to the backend server
    //

    $scope.onSave = function(data) {
        console.log(data);
        $location.search({topology_id: data.id});
        //$location.replace();
        console.log($location.search());
        $scope.$apply();
    };

    $scope.onDeviceCreate = function(data) {
        if (data.sender === $scope.client_id) {
            return;
        }
        var device = new models.Device(data.id,
                                       data.name,
                                       data.x,
                                       data.y,
                                       data.type);
        $scope.devices.push(device);
        $scope.$apply();
    };

    $scope.onLinkCreate = function(data) {
        if (data.sender === $scope.client_id) {
            return;
        }
        var i = 0;
        var new_link = new models.Link(null, null, false);
        for (i = 0; i < $scope.devices.length; i++){
            if ($scope.devices[i].id === data.from_id) {
                new_link.from_device = $scope.devices[i];
            }
        }
        for (i = 0; i < $scope.devices.length; i++){
            if ($scope.devices[i].id === data.to_id) {
                new_link.to_device = $scope.devices[i];
            }
        }
        if (new_link.from_device !== null && new_link.to_device !== null) {
            $scope.links.push(new_link);
            $scope.$apply();
        }
    };

    $scope.onDeviceMove = function(data) {
        if (data.sender === $scope.client_id) {
            return;
        }
        var i = 0;
        for (i = 0; i < $scope.devices.length; i++) {
            if ($scope.devices[i].id === data.id) {
                $scope.devices[i].x = data.x;
                $scope.devices[i].y = data.y;
                $scope.$apply();
                break;
            }
        }
    };

    $scope.onDeviceDestroy = function(data) {
        if (data.sender === $scope.client_id) {
            return;
        }

        var i = 0;
        var j = 0;
        var dindex = -1;
        var lindex = -1;
        var devices = $scope.devices.slice();
        var all_links = $scope.links.slice();
        for (i = 0; i < devices.length; i++) {
            if (devices[i].id === data.id) {
                dindex = $scope.devices.indexOf(devices[i]);
                if (dindex !== -1) {
                    $scope.devices.splice(dindex, 1);
                }
                lindex = -1;
                for (j = 0; j < all_links.length; j++) {
                    if (all_links[j].to_device === devices[i] ||
                        all_links[j].from_device === devices[i]) {
                        lindex = $scope.links.indexOf(all_links[j]);
                        if (lindex !== -1) {
                            $scope.links.splice(lindex, 1);
                        }
                    }
                }
            }
        }
        $scope.$apply();
    };

    $scope.onClientId = function(data) {
        $scope.client_id = data;
    };

    $scope.control_socket.onmessage = function(e) {
        console.log(e.data);
        var type_data = JSON.parse(e.data);
        var type = type_data[0];
        var data = type_data[1];

        if (type === 'save') {
            $scope.onSave(data);
        }
        if (type === 'DeviceCreate') {
            $scope.onDeviceCreate(data);
        }
        if (type === 'LinkCreate') {
            $scope.onLinkCreate(data);
        }
        if (type === 'DeviceMove') {
            $scope.onDeviceMove(data);
        }
        if (type === 'DeviceDestroy') {
            $scope.onDeviceDestroy(data);
        }
        if (type === 'id') {
            $scope.onClientId(data);
        }

	};
	$scope.control_socket.onopen = function() {
		$scope.control_socket.send(JSON.stringify(["message", "hello world"]));
	};
	// Call onopen directly if $scope.control_socket is already open
	if ($scope.control_socket.readyState === WebSocket.OPEN) {
		$scope.control_socket.onopen();
	}

    console.log($location.protocol());
    console.log($location.host());
    console.log($location.port());
    console.log($location.path());
    console.log($location.hash());
    console.log($location.search());
    $location.search({topology_id: "0"});
    console.log($location.search());


    // End web socket
});

exports.app = app;
