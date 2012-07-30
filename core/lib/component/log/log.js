
var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function Log(componentFactory) {
  Log.super_.call(this, componentFactory);
  this.componentType = "log";
  this.levels = [
    "debug",
    "warning",
    "error"
  ];
};
util.inherits(Log, Thywill.getBaseClass("Component"));
var p = Log.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.debug = function (message) {
  throw new Error("Not implemented."); 
};
p.warning = function (message) {
  throw new Error("Not implemented."); 
};
p.error = function (message) {
  throw new Error("Not implemented."); 
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Log;