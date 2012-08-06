/**
 * @fileOverview
 * ConsoleLog class definition. 
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A trivial logger that sends everything to console.log().
 */
function ConsoleLog() {
  ConsoleLog.super_.call(this);
  this.level = this.levels.indexOf("debug");
};
util.inherits(ConsoleLog, Thywill.getBaseClass("Log"));
var p = ConsoleLog.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

ConsoleLog.CONFIG_TEMPLATE = {
  level: {
    _configInfo: {
      description: "The mimimum level of message that will be logged.",
      types: "string",
      required: true,
      allowedValues: ['debug', 'warn', 'error']
    } 
  }
};

//-----------------------------------------------------------
// Initialization and Shutdown
//-----------------------------------------------------------

/**
 * The config object is expected to have the following form:
 * 
 * {
 *   "component": "console",
 *   "level": "debug"
 * }
 * 
 * @see Component#_configure
 */
p._configure = function (thywill, config, callback) {
  // Minimal configuration - all we're doing here is storing it for posterity.
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  
  if (this.config.level) {
    if (this.levels.indexOf(this.config.level) != -1) {
      this.level = this.levels.indexOf(this.config.level);
    } else {
      this._announceReady("Invalid log level in configuration: " + this.config.level);
      return;
    }
  }
  
  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this._announceReady(this.NO_ERRORS);
};

/**
 * @see Component#prepareForShutdown
 */
p._prepareForShutdown = function (callback) {
  // Nothing needed here.
  callback.call(this);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Log#debug
 */
p.debug = function (message) {
  if (this.levels.indexOf("debug") >= this.level) {
    this.log("debug", message);
  }
};

/**
 * @see Log#warning
 */
p.warn = function (message) {
  if (this.levels.indexOf("warn") >= this.level) {
    this.log("warn", message);
  }
};

/**
 * @see Log#error
 */
p.error = function (message) {
  if (this.levels.indexOf("error") >= this.level) {
    this.log("error", message);
  }
};

/**
 * @see Log#log
 */
p.log = function (level, message) {
  if (message && message.toString) {
    console.log("[" + level + "] " + message.toString());
  } else {
    console.log("[" + level + "] " + message);
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ConsoleLog;