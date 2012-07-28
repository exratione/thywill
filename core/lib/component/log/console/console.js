
var util = require("util");
var Log = require("../log");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * A trivial logger that sends everything to console.log().
 */
function Console(componentFactory) {
  Console.super_.call(this, componentFactory);
  this.level = this.levels.indexOf("debug");
};
util.inherits(Console, Log);
var p = Console.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

Console.CONFIG_TEMPLATE = {
  level: {
    _configInfo: {
      description: "The mimimum level of message that will be logged.",
      types: "string",
      required: true,
      allowedValues: ['debug', 'warning', 'error']
    } 
  }
};

//-----------------------------------------------------------
// Initialization and Shutdown
//-----------------------------------------------------------

/*
 * The config object is expected to have the following form:
 * 
 * {
 *   "component": "console",
 *   "level": "debug"
 * }
 */
p._configure = function (thywill, config, callback) {
  
  // Minimal configuration - all we're doing here is storing it for posterity.
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  
  if( this.config.level ) {
    if( this.levels.indexOf(this.config.level) != -1 ) {
      this.level = this.levels.indexOf(this.config.level);
    } else {
      this._announceReady("thywill: invalid log level in configuration: " + this.config.level);
      return;
    }
  }
  
  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this._announceReady(this.NO_ERRORS);
};

p._prepareForShutdown = function (callback) {
  // nothing needed
  callback.call(this);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.debug = function (message) {
  if( this.levels["debug"] >= this.level ) {
    this.log("debug", message);
  }
};

p.warning = function (message) {
  if( this.levels["warning"] >= this.level ) {
    this.log("warning", message);
  }
};

p.error = function (message) {
  if( this.levels["error"] >= this.level ) {
    this.log("error", message);
  }
};

p.log = function (level, message) {
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