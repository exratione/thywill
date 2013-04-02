/**
 * @fileOverview
 * Log class definition.
 */

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
    "info",
    "warn",
    "error"
  ];
}
util.inherits(Log, Thywill.getBaseClass("Component"));
var p = Log.prototype;

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

p.debug = function (message) {
  throw new Error("Not implemented.");
};
p.info = function (message) {
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
