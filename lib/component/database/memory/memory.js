
var util = require("util");
var Database = require("../database");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function Memory() {
  Memory.super_.call(this);
};
util.inherits(Memory, Database);
var p = Memory.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

p._configure = function(config, callback) {

  // Minimal configuration - all we're doing here is storing it for posterity.
  this.config = config; 
  this.readyCallback = callback;
  
  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this.ready = true;
  this._announceReady();
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------


  
//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Memory;