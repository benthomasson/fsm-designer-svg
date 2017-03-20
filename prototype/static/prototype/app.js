
//console.log = function () { };
var app = angular.module('triangular', ['monospaced.mousewheel']);
var fsm = require('./fsm.js');
var view = require('./view.js');
var move = require('./move.js');
var link = require('./link.js');
var buttons = require('./buttons.js');
var util = require('./util.js');
var models = require('./models.js');
var messages = require('./messages.js');

app.controller('MainCtrl', function($scope, $document, $location) {

  $scope.topology_id = $location.search().topology_id || 0;
  $scope.control_socket = new window.ReconnectingWebSocket("ws://" + window.location.host + "/prototype?topology_id=" + $scope.topology_id,
                                                           null,
                                                           {debug: false, reconnectInterval: 300});
  $scope.history = [];
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
  $scope.hide_buttons = false;
  $scope.graph = {'width': window.innerWidth,
                  'right_column': window.innerWidth - 300,
                  'height': window.innerHeight};
  $scope.device_id_seq = util.natural_numbers(1);
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
    new models.Link($scope.devices[0], $scope.devices[1]),
    new models.Link($scope.devices[1], $scope.devices[2]),
    new models.Link($scope.devices[0], $scope.devices[2]),
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

    $scope.updatePanAndScale = function() {
        var g = document.getElementById('frame_g');
        g.setAttribute('transform','translate(' + $scope.panX + ',' + $scope.panY + ') scale(' + $scope.current_scale + ')');
    };

    $scope.clear_selections = function () {

        var i = 0;
        var devices = $scope.devices;
        var links = $scope.links;
        $scope.selected_devices = [];
        $scope.selected_links = [];
        for (i = 0; i < devices.length; i++) {
            if (devices[i].selected) {
                $scope.send_control_message(new messages.DeviceUnSelected($scope.client_id, devices[i].id));
            }
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

        for (i = devices.length - 1; i >= 0; i--) {
            if (devices[i].is_selected($scope.scaledX, $scope.scaledY)) {
                devices[i].selected = true;
                $scope.send_control_message(new messages.DeviceSelected($scope.client_id, devices[i].id));
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

    $scope.send_snapshot = function () {
        var data = JSON.stringify(['Snapshot', {"sender": $scope.client_id,
                                                "devices": $scope.devices,
                                                "links": $scope.links,
                                                "scale": $scope.scale,
                                                "panX": $scope.panX,
                                                "panY": $scope.panY}]);
        $scope.control_socket.send(data);
    };

    $scope.onLoadButton = function (button) {
        console.log(button.name);
    };

    $scope.onDeployButton = function (button) {
        console.log(button.name);
    };

    // Buttons

    $scope.buttons = [
      new models.Button("Deploy", 10, 10, 60, 50, $scope.onDeployButton)
    ];


    // Create a web socket to connect to the backend server
    //

    $scope.onDeviceCreate = function(data) {
        if (data.sender === $scope.client_id) {
            return;
        }
        var device = new models.Device(data.id,
                                       data.name,
                                       data.x,
                                       data.y,
                                       data.type);
        $scope.device_id_seq = util.natural_numbers(data.id);
        $scope.devices.push(device);
        $scope.$apply();
    };

    $scope.onDeviceLabelEdit = function(data) {
        if (data.sender === $scope.client_id) {
            return;
        }
        var i = 0;
        for (i = 0; i < $scope.devices.length; i++) {
            if ($scope.devices[i].id === data.id) {
                $scope.devices[i].name = data.name;
                break;
            }
        }
        $scope.$apply();
    };

    $scope.onLinkCreate = function(data) {
        if (data.sender === $scope.client_id) {
            return;
        }
        var i = 0;
        var new_link = new models.Link(null, null);
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

    $scope.onTopology = function(data) {
        $scope.topology_id = data.topology_id;
        $scope.panX = data.panX;
        $scope.panY = data.panX;
        $scope.current_scale = data.scale;
        $location.search({topology_id: data.topology_id});
        $scope.$apply();
    };

    $scope.onDeviceSelected = function(data) {
        if (data.sender === $scope.client_id) {
            return;
        }
        var i = 0;
        for (i = 0; i < $scope.devices.length; i++) {
            if ($scope.devices[i].id === data.id) {
                $scope.devices[i].remote_selected = true;
                console.log($scope.devices[i].remote_selected);
            }
        }
        $scope.$apply();
    };

    $scope.onDeviceUnSelected = function(data) {
        if (data.sender === $scope.client_id) {
            return;
        }
        var i = 0;
        for (i = 0; i < $scope.devices.length; i++) {
            if ($scope.devices[i].id === data.id) {
                $scope.devices[i].remote_selected = false;
                console.log($scope.devices[i].remote_selected);
            }
        }
        $scope.$apply();
    };

    $scope.onSnapshot = function (data) {
        if (data.sender === $scope.client_id) {
            return;
        }

        $scope.devices = [];
        $scope.links = [];

        var device_map = {};
        var i = 0;
        var device = null;
        var new_device = null;
        var max_device_id = null;
        var min_x = null;
        var min_y = null;
        var max_x = null;
        var max_y = null;
        for (i = 0; i < data.devices.length; i++) {
            device = data.devices[i];
            if (max_device_id === null || device.id > max_device_id) {
                max_device_id = device.id;
            }
            if (min_x === null || device.x < min_x) {
                min_x = device.x;
            }
            if (min_y === null || device.y < min_y) {
                min_y = device.y;
            }
            if (max_x === null || device.x > max_x) {
                max_x = device.x;
            }
            if (max_y === null || device.y > max_y) {
                max_y = device.y;
            }
            new_device = new models.Device(device.id,
                                           device.name,
                                           device.x,
                                           device.y,
                                           device.type);
            $scope.devices.push(new_device);
            device_map[device.id] = new_device;
        }

        var link = null;
        for (i = 0; i < data.links.length; i++) {
            link = data.links[i];
            $scope.links.push(new models.Link(device_map[link.from_device],
                                              device_map[link.to_device]));
        }

        var diff_x;
        var diff_y;

        if (min_x !== null && min_y !== null && max_x !== null && max_y !== null) {
            console.log(['min_x', min_x]);
            console.log(['min_y', min_y]);
            console.log(['max_x', max_x]);
            console.log(['max_y', max_y]);

            diff_x = max_x - min_x;
            diff_y = max_y - min_y;
            console.log(['diff_x', diff_x]);
            console.log(['diff_y', diff_y]);

            console.log(['ratio_x', window.innerWidth/diff_x]);
            console.log(['ratio_y', window.innerHeight/diff_y]);

            $scope.current_scale = Math.min(2, Math.max(0.10, Math.min((window.innerWidth-200)/diff_x, (window.innerHeight-300)/diff_y)));
            $scope.updateScaledXY();
            $scope.updatePanAndScale();
        }
        if (min_x !== null && min_y !== null) {
            console.log(['min_x', min_x]);
            console.log(['min_y', min_y]);
            diff_x = max_x - min_x;
            diff_y = max_y - min_y;
            $scope.panX = $scope.current_scale * (-min_x - diff_x/2) + window.innerWidth/2;
            $scope.panY = $scope.current_scale * (-min_y - diff_y/2) + window.innerHeight/2;
            $scope.updateScaledXY();
            $scope.updatePanAndScale();
        }

        if (max_device_id !== null) {
            console.log(['max_device_id', max_device_id]);
            $scope.device_id_seq = util.natural_numbers(max_device_id);
        }
        $scope.$apply();
    };

    $scope.control_socket.onmessage = function(message) {
        console.log(message.data);
        var type_data = JSON.parse(message.data);
        var type = type_data[0];
        var data = type_data[1];

        if (type === 'DeviceCreate') {
            $scope.history.push(message.data);
            $scope.onDeviceCreate(data);
        }
        if (type === 'LinkCreate') {
            $scope.history.push(message.data);
            $scope.onLinkCreate(data);
        }
        if (type === 'DeviceMove') {
            $scope.history.push(message.data);
            $scope.onDeviceMove(data);
        }
        if (type === 'DeviceDestroy') {
            $scope.history.push(message.data);
            $scope.onDeviceDestroy(data);
        }
        if (type === 'DeviceLabelEdit') {
            $scope.history.push(message.data);
            $scope.onDeviceLabelEdit(data);
        }
        if (type === 'DeviceSelected') {
            $scope.history.push(message.data);
            $scope.onDeviceSelected(data);
        }
        if (type === 'DeviceUnSelected') {
            $scope.history.push(message.data);
            $scope.onDeviceUnSelected(data);
        }
        if (type === 'Snapshot') {
            $scope.history.push(message.data);
            $scope.onSnapshot(data);
        }
        if (type === 'id') {
            $scope.onClientId(data);
        }
        if (type === 'topology') {
            $scope.onTopology(data);
        }

	};
	$scope.control_socket.onopen = function() {
		$scope.control_socket.send(JSON.stringify(["message", "hello world"]));
	};
	// Call onopen directly if $scope.control_socket is already open
	if ($scope.control_socket.readyState === WebSocket.OPEN) {
		$scope.control_socket.onopen();
	}

    $scope.send_control_message = function (message) {
        if ($scope.history.length === 0) {
            $scope.send_snapshot();
        }
        var data = messages.serialize(message);
        $scope.control_socket.send(data);
    };


    // End web socket
});

exports.app = app;
