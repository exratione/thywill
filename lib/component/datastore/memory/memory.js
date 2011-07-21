
var util = require("util");
var Datastore = require("../datastore");
var Component = require("../../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * A trivial synchronous in-memory datastore.
 */
function Memory() {
  Memory.super_.call(this);
  this.data = {};
};
util.inherits(Memory, Datastore);
var p = Memory.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

Memory.CONFIG_TEMPLATE = null;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

p._configure = function(thywill, config, callback) {

  // Minimal configuration - all we're doing here is storing it for posterity.
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  
  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this._announceReady(Component.NO_ERRORS);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.store = function(key, object, callback) {
  this.data[key] = object;
  callback(Component.NO_ERRORS);
};

p.remove = function(key, callback) {
  var object = null;
  var error = Component.NO_ERRORS;
  if( this.data[key] ) {
    object = this.data[key];
    delete this.data[key];
  } else {
    error = "Memory.remove(): No such key:" + key;
  } 
  callback(error, object);
};

p.load = function(key, callback) {
  if( this.data[key] ) { 
    callback(Component.NO_ERRORS, this.data[key]);
  } else {
    callback("Memory.load(): No such key:" + key, null);
  }
};
  
//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Memory;