var EventEmitter = require("events").EventEmitter;
var util = require("util");
var componentFactory = require("./componentFactory");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The superclass for the thywill framework component classes.
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
// "Static" variables
//-----------------------------------------------------------

/*
 * Used to make callback code a little more comprehensible, since most callbacks are
 * of the form function(error, results...) where error == null on success.
 */
Component.NO_ERRORS = null;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/*
 * Announce that the component object is ready for use. This implies that
 * all asynchronous configuration and initialization tasks required for this
 * object to be used are now complete.
 * 
 * error - null on success.
 */
p._announceReady = function(error) {
  if( !error ) {
    this.ready = true;
    this.emit("thywill." + this.componentType + ".ready");
  }
  if( this.readyCallback ) {
    this.readyCallback(error);
  }
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/*
 * Configure and initialize.
 * 
 * config - JSON configuration data.
 * callback - function(err) where err == null on success.
 */
p._configure = function(config, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Component;