/**
 * @fileOverview
 * Simple class definition, a message manager implementation.
 */

var util = require("util");
var Thywill = require("thywill");
var SimpleMessage = require("./simpleMessage");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A trivial synchronous in-memory resource manager.
 */
function Simple() {
  Simple.super_.call(this);
  this.data = {};
};
util.inherits(Simple, Thywill.getBaseClass("MessageManager"));
var p = Simple.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

Simple.CONFIG_TEMPLATE = null;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

/**
 * @see Component#_configure
 */
p._configure = function (thywill, config, callback) {
  // Minimal configuration - all we're doing here is storing it for posterity.
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  
  // There are no asynchronous initialization functions here or in the 
  // superclasses. So we can just call them and forge ahead without having
  // to wait around or check for completion.
  this._announceReady(this.NO_ERRORS);
};

/**
 * @see Component#_prepareForShutdown
 */
p._prepareForShutdown = function (callback) {
  // Nothing needed here.
  callback.call(this);
};
  
//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see MessageManager#createMessage
 */
p.createMessage = function(data, sessionId, applicationId) {
  return new SimpleMessage(data, sessionId, applicationId);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Simple;