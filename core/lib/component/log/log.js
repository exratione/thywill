
var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function Log() {
  Log.super_.call(this);
  this.componentType = "log";
  this.levels = [
    "debug",
    "warn",
    "error"
  ];
}
util.inherits(Log, Thywill.getBaseClass("Component"));
var p = Log.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.debug = function (message) {
  throw new Error("Not implemented.");
};
p.warn = function (message) {
  throw new Error("Not implemented.");
};
p.error = function (message) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Log;
