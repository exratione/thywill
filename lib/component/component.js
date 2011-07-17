var EventEmitter = require("events").EventEmitter;
var util = require("util");

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
  this.thywill = null;
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
 * error - Component.NO_ERRORS on success.
 */
p._announceReady = function(error) {
  if( !error ) {
    this.ready = true;
  }
  if( this.componentType = "thywill" ) {
    var eventName = "thywill.ready";
  } else {
    var eventName = "thywill." + this.componentType + ".ready";
  }
  this.emit(eventName, error);
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
 * thywill - the thywill instance, used to obtain component references
 * config - JSON configuration data.
 * callback - function(error) where error == Component.NO_ERRORS on success.
 */
p._configure = function(thywill, config, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Component;