/* Copyright (c) 2017 Red Hat, Inc. */

function noop () {
}
exports.noop = noop;

function natural_numbers (start) {
    var counter = start;
    return function () {return counter += 1;};
}
exports.natural_numbers = natural_numbers;

function distance (x1, y1, x2, y2) {

    return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
}
exports.distance = distance;
