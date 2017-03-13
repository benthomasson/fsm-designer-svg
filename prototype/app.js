var app = angular.module('triangular', []);

var scope;

app.controller('MainCtrl', function($scope) {

  $scope.onMouseDownResult = "";
  $scope.onMouseUpResult = "";
  $scope.onMouseEnterResult = "";
  $scope.onMouseLeaveResult = "";
  $scope.onMouseMoveResult = "";
  $scope.onMouseOverResult = "";

  scope = $scope
  $scope.graph = {'width': window.innerWidth,
                  'right_column': window.innerWidth - 300,
                  'height': window.innerHeight}
  $scope.circles = [
  	{'x': 15, 'y': 20, 'r':15},
  	{'x': 50, 'y': 60, 'r':20},
  	{'x': 80, 'y': 10, 'r':10},
  ]

    // Utility functions

    // Accepts a MouseEvent as input and returns the x and y
    // coordinates relative to the target element.
    var getCrossBrowserElementCoords = function (mouseEvent)
    {
      console.log(mouseEvent);
      var result = {
        x: 0,
        y: 0
      };
      console.log(result);

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
      console.log(result);

      return result;
    };

    var getMouseEventResult = function (mouseEvent, mouseEventDesc)
    {
      var coords = getCrossBrowserElementCoords(mouseEvent);
      return mouseEventDesc + " at (" + coords.x + ", " + coords.y + ")";
    };

    $scope.onMouseDown = function ($event) {
      $scope.onMouseDownResult = getMouseEventResult($event, "Mouse down");
	  $event.preventDefault();
    };

    $scope.onMouseUp = function ($event) {
      $scope.onMouseUpResult = getMouseEventResult($event, "Mouse up");
	  $event.preventDefault();
    };

    $scope.onMouseEnter = function ($event) {
      $scope.onMouseEnterResult = getMouseEventResult($event, "Mouse enter");
	  $event.preventDefault();
    };

    $scope.onMouseLeave = function ($event) {
      $scope.onMouseLeaveResult = getMouseEventResult($event, "Mouse leave");
	  $event.preventDefault();
    };

    $scope.onMouseMove = function ($event) {
      $scope.onMouseMoveResult = getMouseEventResult($event, "Mouse move");
	  $event.preventDefault();
    };

    $scope.onMouseOver = function ($event) {
      $scope.onMouseOverResult = getMouseEventResult($event, "Mouse over");
	  $event.preventDefault();
    };
});
