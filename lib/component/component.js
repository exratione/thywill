var EventEmitter = require("events").EventEmitter;
var util = require("util");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The superclass for most of the thywill framework component classes.
 */
function Component() {
  this.componentType = "component";
  this.config = null;
  this.ready = false;
  this.readyCallback = null;
  this.initializationFunctionNames = [];
};
util.inherits(Components, EventEmitter);

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

Thywill.prototype._announceReady = function() {
  this.ready = true;
  this.emit("thywill." + this.componentType + ".ready");
  if( this.readyCallback ) {
    this.readyCallback();
  }
};

Thywill.prototype._initialize = function() {
  for each ( var fn in this.initializationFunctionNames ) {
    this[fn]();
  }
}

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

Component.prototype.configure = function(config, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports
//-----------------------------------------------------------

module.exports = Component;