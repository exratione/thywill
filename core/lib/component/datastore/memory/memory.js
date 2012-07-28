/**
 * @fileOverview
 * Memory class definition.
 */

var util = require("util");
var Datastore = require("../datastore");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
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

p._configure = function (thywill, config, callback) {

  // Minimal configuration - all we're doing here is storing it for posterity.
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  
  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this._announceReady(this.NO_ERRORS);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.store = function (key, object, callback) {
  this.data[key] = object;
  callback(this.NO_ERRORS);
};

p.remove = function (key, callback) {
  var object = null;
  var error = this.NO_ERRORS;
  if( this.data[key] ) {
    object = this.data[key];
    delete this.data[key];
  } 
  callback(error, object);
};

p.load = function (key, callback) {
  if( this.data[key] ) { 
    callback(this.NO_ERRORS, this.data[key]);
  } else {
    callback(this.NO_ERRORS, null);
  }
};
  
//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Memory;