
//console.log = function () { };
var app = angular.module('triangular', ['monospaced.mousewheel']);
var fsm = require('./fsm.js');
var view = require('./view.js');
var move = require('./move.js');
var link = require('./link.js');
var buttons = require('./buttons.js');
var time = require('./time.js');
var util = require('./util.js');
var models = require('./models.js');
var messages = require('./messages.js');

app.controller('MainCtrl', function($scope, $document, $location, $window) {

  $scope.topology_id = $location.search().topology_id || 0;
  // Create a web socket to connect to the backend server
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
  $scope.time_controller = new fsm.FSMController($scope, time.Start, $scope.buttons_controller);
  $scope.first_controller = $scope.time_controller;
  $scope.last_key = "";
  $scope.last_key_code = null;
  $scope.last_event = null;
  $scope.cursor = {'x':100, 'y': 100, 'hidden': false};

  $scope.debug = {'hidden': true};
  $scope.hide_buttons = false;
  $scope.graph = {'width': window.innerWidth,
                  'right_column': window.innerWidth - 300,
                  'height': window.innerHeight};
  $scope.device_id_seq = util.natural_numbers(0);
  $scope.message_id_seq = util.natural_numbers(0);
  $scope.time_pointer = -1;
  $scope.frame = 0;


  $scope.devices = [
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

    $scope.forget_time = function () {
        $scope.history.splice($scope.time_pointer);
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
                                                "panY": $scope.panY,
                                                "message_id": $scope.message_id_seq()}]);
        $scope.control_socket.send(data);
    };

    $scope.onDeployButton = function (button) {
        console.log(button.name);
    };

    // Buttons

    $scope.buttons = [
      new models.Button("Deploy", 10, 10, 60, 50, $scope.onDeployButton)
    ];



    $scope.onDeviceCreate = function(data) {
        $scope.create_device(data);
    };

    $scope.create_device = function(data) {
        var device = new models.Device(data.id,
                                       data.name,
                                       data.x,
                                       data.y,
                                       data.type);
        $scope.device_id_seq = util.natural_numbers(data.id);
        $scope.devices.push(device);
    };

    $scope.onDeviceLabelEdit = function(data) {
        $scope.edit_device_label(data);
    };

    $scope.edit_device_label = function(data) {
        var i = 0;
        for (i = 0; i < $scope.devices.length; i++) {
            if ($scope.devices[i].id === data.id) {
                $scope.devices[i].name = data.name;
                break;
            }
        }
    };

    $scope.onLinkCreate = function(data) {
        $scope.create_link(data);
    };

    $scope.create_link = function(data) {
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
        }
    };

    $scope.onLinkDestroy = function(data) {
        $scope.destroy_link(data);
    };

    $scope.destroy_link = function(data) {
        var i = 0;
        var link = null;
        var index = -1;
        for (i = 0; i < $scope.links.length; i++) {
            link = $scope.links[i];
            if (link.from_device.id === data.from_id && link.to_device.id === data.to_id) {
                index = $scope.links.indexOf(link);
                $scope.links.splice(index, 1);
            }
        }
    };

    $scope.onDeviceMove = function(data) {
        $scope.move_devices(data);
    };

    $scope.move_devices = function(data) {
        var i = 0;
        for (i = 0; i < $scope.devices.length; i++) {
            if ($scope.devices[i].id === data.id) {
                $scope.devices[i].x = data.x;
                $scope.devices[i].y = data.y;
                break;
            }
        }
    };

    $scope.onDeviceDestroy = function(data) {
        $scope.destroy_device(data);
    };

    $scope.destroy_device = function(data) {

        // Delete the device and any links connecting to the device.
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
    };

    $scope.redo = function(type_data) {
        var type = type_data[0];
        var data = type_data[1];

        if (type === "DeviceMove") {
            $scope.move_devices(data);
        }

        if (type === "DeviceCreate") {
            $scope.create_device(data);
        }

        if (type === "DeviceDestroy") {
            $scope.destroy_device(data);
        }

        if (type === "DeviceLabelEdit") {
            $scope.edit_device_label(data);
        }

        if (type === "LinkCreate") {
            $scope.create_link(data);
        }

        if (type === "LinkDestroy") {
            $scope.destroy_link(data);
        }
    };


    $scope.undo = function(type_data) {
        var type = type_data[0];
        var data = type_data[1];
        var inverted_data;

        if (type === "DeviceMove") {
            inverted_data = angular.copy(data);
            inverted_data.x = data.previous_x;
            inverted_data.y = data.previous_y;
            $scope.move_devices(inverted_data);
        }

        if (type === "DeviceCreate") {
            $scope.destroy_device(data);
        }

        if (type === "DeviceDestroy") {
            inverted_data = new messages.DeviceCreate(data.sender,
                                                      data.id,
                                                      data.previous_x,
                                                      data.previous_y,
                                                      data.previous_name,
                                                      data.previous_type);
            $scope.create_device(inverted_data);
        }

        if (type === "DeviceLabelEdit") {
            inverted_data = angular.copy(data);
            inverted_data.name = data.previous_name;
            $scope.edit_device_label(inverted_data);
        }

        if (type === "LinkCreate") {
            $scope.destroy_link(data);
        }

        if (type === "LinkDestroy") {
            $scope.create_link(data);
        }
    };

    $scope.onClientId = function(data) {
        $scope.client_id = data;
    };

    $scope.onFiniteStateMachine = function(data) {
        $scope.topology_id = data.topology_id;
        $scope.panX = data.panX;
        $scope.panY = data.panX;
        $scope.current_scale = data.scale;
        $location.search({topology_id: data.topology_id});
    };

    $scope.onDeviceSelected = function(data) {
        var i = 0;
        for (i = 0; i < $scope.devices.length; i++) {
            if ($scope.devices[i].id === data.id) {
                $scope.devices[i].remote_selected = true;
                console.log($scope.devices[i].remote_selected);
            }
        }
    };

    $scope.onDeviceUnSelected = function(data) {
        var i = 0;
        for (i = 0; i < $scope.devices.length; i++) {
            if ($scope.devices[i].id === data.id) {
                $scope.devices[i].remote_selected = false;
                console.log($scope.devices[i].remote_selected);
            }
        }
    };

    $scope.onHistory = function (data) {

        $scope.history = [];
        var i = 0;
        for (i = 0; i < data.length; i++) {
            //console.log(data[i]);
            $scope.history.push(data[i]);
        }
    };

    $scope.onSnapshot = function (data) {

        //Erase the existing state
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

        //Build the devices
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

        //Build the links
        var link = null;
        for (i = 0; i < data.links.length; i++) {
            link = data.links[i];
            $scope.links.push(new models.Link(device_map[link.from_device],
                                              device_map[link.to_device]));
        }

        var diff_x;
        var diff_y;

        // Calculate the new scale to show the entire diagram
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
        // Calculate the new panX and panY to show the entire diagram
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

        //Update the device_id_seq to be greater than all device ids to prevent duplicate ids.
        if (max_device_id !== null) {
            console.log(['max_device_id', max_device_id]);
            $scope.device_id_seq = util.natural_numbers(max_device_id);
        }
    };


    $scope.control_socket.onmessage = function(message) {
        $scope.first_controller.state.onMessage($scope.first_controller, message);
        $scope.$apply();
    };

	$scope.control_socket.onopen = function() {
        //Ignore
	};

	// Call onopen directly if $scope.control_socket is already open
	if ($scope.control_socket.readyState === WebSocket.OPEN) {
		$scope.control_socket.onopen();
	}

    $scope.send_control_message = function (message) {
        if ($scope.history.length === 0) {
            $scope.send_snapshot();
        }
        message.sender = $scope.client_id;
        message.message_id = $scope.message_id_seq();
        var data = messages.serialize(message);
        $scope.control_socket.send(data);
    };


    // End web socket
    //

	angular.element($window).bind('resize', function(){

		$scope.graph.width = $window.innerWidth;
	  	$scope.graph.right_column = $window.innerWidth - 300;
	  	$scope.graph.height = $window.innerHeight;

		// manuall $digest required as resize event
		// is outside of angular
	 	$scope.$digest();
    });

    window.scope = $scope;
});

app.directive('cursor', function() {
  return { restrict: 'A', templateUrl: 'widgets/cursor.html' };
});

app.directive('debug', function() {
  return { restrict: 'A', templateUrl: 'widgets/debug.html' };
});

app.directive('router', function() {
  return { restrict: 'A', templateUrl: 'widgets/router.html' };
});

app.directive('switch', function() {
  return { restrict: 'A', templateUrl: 'widgets/switch.html' };
});

app.directive('host', function() {
  return { restrict: 'A', templateUrl: 'widgets/host.html' };
});

app.directive('link', function() {
  return { restrict: 'A', templateUrl: 'widgets/link.html' };
});

app.directive('rack', function() {
  return { restrict: 'A', templateUrl: 'widgets/rack.html' };
});

app.directive('default', function() {
  return { restrict: 'A', templateUrl: 'widgets/default.html' };
});

app.directive('quadrants', function() {
  return { restrict: 'A', templateUrl: 'widgets/quadrants.html' };
});

app.directive('stencil', function() {
  return { restrict: 'A', templateUrl: 'widgets/stencil.html' };
});

app.directive('layer', function() {
  return { restrict: 'A', templateUrl: 'widgets/layer.html' };
});

app.directive('button', function() {
  return { restrict: 'A', templateUrl: 'widgets/button.html' };
});

app.directive('statusLight', function() {
  return { restrict: 'A', templateUrl: 'widgets/status_light.html' };
});


exports.app = app;
