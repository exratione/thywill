/**
 * @fileOverview
 * ConsoleLog class definition.
 */

var util = require('util');
var Thywill = require('thywill');
var dateFormat = require('dateformat');

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A trivial logger that sends everything to console.log().
 */
function ConsoleLog() {
  ConsoleLog.super_.call(this);
  this.level = this.levels.indexOf('debug');
}
util.inherits(ConsoleLog, Thywill.getBaseClass('Log'));
var p = ConsoleLog.prototype;

//-----------------------------------------------------------
// 'Static' parameters
//-----------------------------------------------------------

ConsoleLog.CONFIG_TEMPLATE = {
  dateFormat: {
    _configInfo: {
      description: 'The date format used in log output.',
      types: 'string',
      required: true
    }
  },
  level: {
    _configInfo: {
      description: 'The mimimum level of message that will be logged.',
      types: 'string',
      required: true,
      allowedValues: ['debug', 'info', 'warn', 'error']
    }
  }
};

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

/**
 * The config object is expected to have the following form:
 *
 * {
 *   'component': 'console',
 *   'level': 'debug'
 * }
 *
 * @see Component#_configure
 */
p._configure = function (thywill, config, callback) {
  this.thywill = thywill;
  this.config = config;
  this.readyCallback = callback;

  if (this.config.level) {
    if (this.levels.indexOf(this.config.level) !== -1) {
      this.level = this.levels.indexOf(this.config.level);
    } else {
      this._announceReady('Invalid log level in configuration: ' + this.config.level);
      return;
    }
  }

  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this._announceReady(this.NO_ERRORS);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Log#debug
 */
p.debug = function (message) {
  if (this.levels.indexOf('debug') >= this.level) {
    this.log('DEBUG', message);
  }
};

/**
 * @see Log#info
 */
p.info = function (message) {
  if (this.levels.indexOf('info') >= this.level) {
    this.log('INFO', message);
  }
};

/**
 * @see Log#warning
 */
p.warn = function (message) {
  if (this.levels.indexOf('warn') >= this.level) {
    this.log('WARN', message);
  }
};

/**
 * @see Log#error
 */
p.error = function (message) {
  if (this.levels.indexOf('error') >= this.level) {
    this.log('ERROR', message, true);
  }
};

/**
 * @see Log#log
 */
p.log = function (level, message, toError) {
  var date = dateFormat(new Date(), this.config.dateFormat);
  if (message instanceof Error) {
    message = message.stack;
  }
  var str = '[' + date + '] ' + level + ' ' + message;
  if (toError) {
    console.error(str);
  } else {
    console.log(str);
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ConsoleLog;
