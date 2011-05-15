
var util = require("util");
var Log = require("../log");
var Component = require("../../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function Console() {
  Console.super_.call(this);
  this.level = levels.indexOf("debug");
};
util.inherits(Console, Log);
var p = Console.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

p._configure = function(config, callback) {
  
  // Minimal configuration - all we're doing here is storing it for posterity.
  this.config = config; 
  this.readyCallback = callback;
  
  if( this.config.level ) {
    if( this.levels.indexOf(this.config.level) ) {
      this.level = levels.indexOf(this.config.level);
    } else {
      throw new Error("thywill: invalid log level in configuration: " + this.config.level);
    }
  }
  
  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this._announceReady(Component.NO_ERRORS);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.debug = function(message) {
  if( this.levels["debug"] >= this.level ) {
    this.log("debug", message);
  }
};

p.warning = function(message) {
  if( this.levels["warning"] >= this.level ) {
    this.log("warning", message);
  }
};

p.error = function(message) {
  if( this.levels["error"] >= this.level ) {
    this.log("error", message);
  }
};

p.log = function(level, message) {
  if( message && message.toString() ) {
    console.log("[" + level + "] " + message.toString());
  } else {
    console.log("[" + level + "] " + message);
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Console;