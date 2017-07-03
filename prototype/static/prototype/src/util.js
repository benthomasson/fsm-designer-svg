

function natural_numbers (start) {
    var counter = start;
    return function () {return counter += 1;};
}
exports.natural_numbers = natural_numbers;

// polarToCartesian
// From http://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
// @opsb, @wdebeaum

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}
exports.polarToCartesian = polarToCartesian;

function polarToCartesian_rad(centerX, centerY, radius, angleInRadians) {

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}
exports.polarToCartesian_rad = polarToCartesian_rad;

function cartesianToPolar(x, y) {

    return {
        r: Math.sqrt(Math.pow(x,2) + Math.pow(y, 2)),
        theta: Math.atan2(y, x)
    };
}
exports.cartesianToPolar = cartesianToPolar;

// describeArc
// From http://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
// @opsb, @wdebeaum

function describeArc(x, y, radius, startAngle, endAngle){

    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);

    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    var d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");

    return d;
}
exports.describeArc = describeArc;
