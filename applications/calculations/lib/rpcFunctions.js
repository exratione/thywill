/**
 * @fileOverview
 * A set of functions used to demonstrate RPC in Thywill.
 */

exports.multiplicative = {
  square: function (a) {
    return a * a;
  },

  squareRootWithCallback: function (a, callback) {
    callback (null, Math.sqrt(a));
  }
};

exports.additive = {
  add: function (a, b) {
    return a + b;
  },

  subtractWithCallback: function (a, b, callback) {
    callback(null, a - b);
  }
};
