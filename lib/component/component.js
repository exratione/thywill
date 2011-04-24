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
  this.initializationMethodNames = [];
};
util.inherits(Components, EventEmitter);

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/*
 * Announce that the component object is ready for use. This implies that
 * all asynchronous configuration and initialization tasks required for this
 * object to be used are now complete.
 */
Thywill.prototype._announceReady = function() {
  this.ready = true;
  this.emit("thywill." + this.componentType + ".ready");
  if( this.readyCallback ) {
    this.readyCallback();
  }
};

/*
 * Call all of the methods on this object that are designated to be called on initialization.
 * This function should be called in a subclass implementation of the "configure" method.
 */
Thywill.prototype._initialize = function() {
  // Done this way to ensure that "this" inside the initialization methods still points back to the object.
  var length = this.initializationMethodNames.length;
  for( var i = 0; i < length; i++ ) {
    var functionName = this.initializationMethodNames[i];
    this[functionName]();
  }
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

Component.prototype.configure = function(config, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Definition
//-----------------------------------------------------------

module.exports = Component;