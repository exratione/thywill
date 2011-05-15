
var util = require("util");
var Component = require("../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function Log() {
  Log.super_.call(this);
  this.componentType = "log";
  this.levels = [
    "debug",
    "warning",
    "error"
  ];
};
util.inherits(Log, Component);
var p = Log.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.debug = function(message) {
  throw new Error("Not implemented."); 
};
p.warning = function(message) {
  throw new Error("Not implemented."); 
};
p.error = function(message) {
  throw new Error("Not implemented."); 
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Log;