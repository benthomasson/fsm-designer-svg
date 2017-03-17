

function natural_numbers () {
    var counter = 1;
    return function () {return counter += 1;};
}
exports.natural_numbers = natural_numbers;
