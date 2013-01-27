/**
 * @fileOverview
 * A set of simple functions used to demonstrate RPC. Some have callbacks,
 * some do not.
 */

exports.multiplicative = {
  multiplyByTwo: function (a) {
    return a * 2;
  },

  divideByTwo: function (a, callback) {
    callback (null, a / 2);
  }
};

exports.powers = {
  square: function (a) {
    return a * a;
  },

  squareRoot: function (a, callback) {
    callback (null, Math.sqrt(a));
  }
};
