var EventEmitter = require("events").EventEmitter;
var util = require("util");
var componentFactory = require("./componentFactory");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The superclass for most of the thywill framework component classes.
 */
function Component() {
  Component.super_.call(this);
  this.componentType = "component";
  this.config = null;
  this.ready = false;
  this.readyCallback = null;  
  this.factory = componentFactory;
};
util.inherits(Component, EventEmitter);
var p = Component.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/*
 * Announce that the component object is ready for use. This implies that
 * all asynchronous configuration and initialization tasks required for this
 * object to be used are now complete.
 */
p._announceReady = function() {
  this.ready = true;
  this.emit("thywill." + this.componentType + ".ready");
  if( this.readyCallback ) {
    this.readyCallback();
  }
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

p.configure = function(config, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Component;